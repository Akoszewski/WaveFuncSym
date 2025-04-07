function roundComplex(complexNum, decimals)
{
    return math.complex(
        math.round(complexNum.re, decimals),
        math.round(complexNum.im, decimals)
    );
}

function setPixel(ctx, pixelBuffer, x, y, color = [0, 0, 0, 255])
{
    const index = (y * ctx.canvas.width + x) * 4;
    pixelBuffer.data[index] = color[0];     // R
    pixelBuffer.data[index + 1] = color[1]; // G
    pixelBuffer.data[index + 2] = color[2]; // B
    pixelBuffer.data[index + 3] = color[3]; // A
}

// function initializeRandomNoise(width, height)
// {
//     const psi = new Array(height).fill(0).map(() => new Array(width).fill(0));
//     for (let y = 0; y < height; y++)
//     {
//         for (let x = 0; x < width; x++)
//         {
//             psi[y][x] = roundComplex(math.complex(Math.random() - 0.5, Math.random() - 0.5), 3);
//         }
//     }
//     return psi;
// }

function initializeGaussianWavepacket(w, h, center_x, center_y, sigma, init_momemtum_x, init_momentum_y, scalingConstant)
{
    let psiRe = new Float64Array(w*h);
    let psiIm = new Float64Array(w*h);
    var maxValRe = 0;
    var maxValIm = 0;
    for (let x = 0; x < w; x++)
    {
        for (let y = 0; y < h; y++)
        {
            var initMomentums = math.complex(0, init_momemtum_x * x + init_momentum_y * y);
            var quotient = -((x-center_x)**2 + (y-center_y)**2)/4*sigma**2;
            var exponent = math.exp(math.multiply(math.add(quotient, initMomentums), scalingConstant));
            psiRe[x*h + y] = exponent.re;
            psiIm[x*h + y] = exponent.im;
            if (exponent.re > maxValRe) {
                maxValRe = exponent.re;
            }
            if (exponent.im > maxValIm) {
                maxValIm = exponent.im;
            }
        }
    }
    console.log("maxValRe = " + maxValRe)
    console.log("maxValRe = " + maxValRe)

    return [psiRe, psiIm];
}

// function initializeRandomNoise(width, height) {
//     return Array.from({ length: height }, () =>
//         Array.from({ length: width }, () => {
//             let theta = Math.random() * 2 * Math.PI;
//             return math.complex(Math.cos(theta), Math.sin(theta));
//         })
//     );
// }

function initializePotentialAtOnePoint(w, h)
{
    var potential = new Float64Array(w * h);
    potential[(w/2)*h + h*0.75] = 0.5;
    return potential;
}

function initializeEmptyPotential(w, h)
{
    return new Float64Array(w * h);
}

function getInitialWaveFunction(w, h)
{
    return initializeGaussianWavepacket(w, h, w/2, h/2, 20, 2, 2, 0.001);
}

function getInitialPotential(w, h)
{
    return initializePotentialAtOnePoint(w, h);
}

function calculateLaplacianAtPoint(func, w, h, x, y)
{
    return (func[(x+1)*h + y] - 2*func[x*h + y] + func[(x-1)*h + y] + func[x*h + y+1] - 2*func[x*h + y] + func[x*h + y-1]);
}

function createWaveEvolutionKernel(w, h, rounding) {
    const gpu = new GPU();
    
    return gpu.createKernel(function(psiRe, psiIm, potential, factor) {
        const x = this.thread.x;
        const y = this.thread.y;
        const h = this.constants.h;
        const idx = x * h + y;
        
        // Skip boundaries (for mirroring effect)
        if (x === 0 || x === this.constants.w-1 || y === 0 || y === h-1) {
            return [psiRe[idx], psiIm[idx]];
        }
        
        // Calculate Laplacian (same logic as CPU version)
        let laplaceRe = (
            psiRe[(x+1)*h + y] + 
            psiRe[(x-1)*h + y] + 
            psiRe[x*h + (y+1)] + 
            psiRe[x*h + (y-1)] - 
            4 * psiRe[idx]
        );
        
        let laplaceIm = (
            psiIm[(x+1)*h + y] + 
            psiIm[(x-1)*h + y] + 
            psiIm[x*h + (y+1)] + 
            psiIm[x*h + (y-1)] - 
            4 * psiIm[idx]
        );
        
        // Apply rounding if specified
        if (this.constants.rounding > -1) {
            laplaceRe = Math.round(laplaceRe * Math.pow(10, this.constants.rounding)) / Math.pow(10, this.constants.rounding);
            laplaceIm = Math.round(laplaceIm * Math.pow(10, this.constants.rounding)) / Math.pow(10, this.constants.rounding);
        }
        
        // Time evolution (same logic as CPU version)
        let newRe = psiRe[idx] + (-factor) * laplaceIm + potential[idx] * psiIm[idx];
        let newIm = psiIm[idx] + factor * laplaceRe - potential[idx] * psiRe[idx];
        
        // Apply rounding to final values if specified
        if (this.constants.rounding > -1) {
            newRe = Math.round(newRe * Math.pow(10, this.constants.rounding)) / Math.pow(10, this.constants.rounding);
            newIm = Math.round(newIm * Math.pow(10, this.constants.rounding)) / Math.pow(10, this.constants.rounding);
        }
        
        return [newRe, newIm];
    })
    .setOutput([w, h])
    .setConstants({
        w: w,
        h: h,
        rounding: rounding
    });
}

function getUpdatedWaveFunction(psi, w, h, potential, reducedPlanckConstant, mass, rounding) {
    const delta_t = 0.1;
    const factor = reducedPlanckConstant * delta_t / (2 * mass);
    
    // Create kernel (cache this for better performance)
    const kernel = createWaveEvolutionKernel(w, h, rounding);
    
    // Execute on GPU
    const result = kernel(psi[0], psi[1], potential, factor);
    
    // Convert texture output back to arrays
    const psiRe = new Float32Array(w * h);
    const psiIm = new Float32Array(w * h);
    
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const idx = x * h + y;
            psiRe[idx] = result[x][y][0];
            psiIm[idx] = result[x][y][1];
        }
    }
    
    console.log("Central value = " + psiRe[(w/2)*h + h/2]);
    return [psiRe, psiIm];
}

function Draw(ctx, pixelBuffer, psiRe, psiIm, steps)
{
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    for (var x = 0; x < w; x++)
    {
        for (var y = 0; y < h; y++)
        {
            const probability = psiRe[x*h + y] ** 2 + psiIm[x*h + y] ** 2;
            const r = Math.floor(255 * probability);
            const g = Math.floor(255 * probability);
            const b = 0;
            
            setPixel(ctx, pixelBuffer, x, y, [r, g, b, 255]);
        }
    }
    ctx.putImageData(pixelBuffer, 0, 0);
}

window.isRunning = true;

export function Play(ctx)
{
    const pixelBuffer = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    var steps = 0;
    window.isRunning = true;
    var psi = Array();
    var potential = getInitialPotential(ctx.canvas.width, ctx.canvas.height);
    setInterval(() =>
    {
        if (steps == 0)
        {
            psi = getInitialWaveFunction(ctx.canvas.width, ctx.canvas.height);
            steps = steps + 1;
        }
        else
        {
            if (window.isRunning)
            {
                psi = getUpdatedWaveFunction(psi, ctx.canvas.width, ctx.canvas.height, potential, 1, 1, -1);
                steps = steps + 1;
            }
        }
        console.log("Steps = " + steps)
        var psiRe = psi[0];
        var psiIm = psi[1];
        Draw(ctx, pixelBuffer, psiRe, psiIm, steps);
    },
    50);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        console.log("spacja")
        window.isRunning = window.isRunning ? false : true;
    }
  });