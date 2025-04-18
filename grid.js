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

function initializeGaussianWavepacket(w, h, center_x, center_y, sigma, init_momentum_x, init_momentum_y)
{
    let psiRe = new Float64Array(w*h);
    let psiIm = new Float64Array(w*h);
    var maxValRe = 0;
    var maxValIm = 0;
    var scalingConstant = 1/(sigma*math.sqrt(2*math.pi));
    for (let x = 0; x < w; x++)
    {
        for (let y = 0; y < h; y++)
        {
            var initMomentums = math.complex(0, init_momentum_x * x + init_momentum_y * y);
            var quotient = -((x-center_x)**2 + (y-center_y)**2)/(4*sigma**2);
            var exponent = math.exp(math.add(quotient, initMomentums));
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

function initializeGaussianPotential(w, h, center_x, center_y, sigma)
{
    let potential = new Float64Array(w*h);
    var scalingConstant = 1/(sigma*math.sqrt(2*math.pi));
    for (let x = 0; x < w; x++)
    {
        for (let y = 0; y < h; y++)
        {
            var quotient = -((x-center_x)**2 + (y-center_y)**2)/(4*sigma**2);
            potential[x*h + y] = math.exp(quotient);
        }
    }
    return potential;
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

function initializeGaussianPotentialWell(w, h)
{
    var potential = new Float64Array(w * h);

    // var centerX = w/2;
    // var centerY = h/2;
    // var sigma = w/8;

    // for (let x = 0; x < w; x++) {
    //     for (let y = 0; y < h; y++) {
    //         var dx = x - centerX;
    //         var dy = y - centerY;
    //         potential[x*h + y] = 5 * Math.exp(-(dx*dx + dy*dy)/(2*sigma*sigma));
    //     }
    // }

    return potential;
}

function initializeEmptyPotential(w, h)
{
    return new Float64Array(w * h);
}

function getInitialWaveFunction(w, h)
{
    return initializeGaussianWavepacket(w, h, w/2, h/2, 1.5, 2, 2, 1);
}

function getInitialPotential(w, h)
{
    // return initializeGaussianPotentialWell(w, h);
    // return initializePotentialAtOnePoint(w, h);
    // return initializeEmptyPotential(w, h);
    return initializeGaussianPotential(w, h, w*0.5, h*0.75, 1.5);
}

function calculateLaplacianAtPoint(func, w, h, x, y)
{
    return (func[(x+1)*h + y] - 2*func[x*h + y] + func[(x-1)*h + y] + func[x*h + y+1] - 2*func[x*h + y] + func[x*h + y-1]);
}

function getUpdatedWaveFunction(psi, w, h, potential, reducedPlanckConstant, mass, rounding)
{
    var protectBoundaries = true;
    var psiRe = psi[0];
    var psiIm = psi[1];
    var delta_t = 0.01;
    var factor = reducedPlanckConstant * delta_t / (2 * mass);
    for (let x = 1; x < w - 1; x++)
    {
        for (let y = 1; y < h - 1; y++)
        {
            var laplaceRe = calculateLaplacianAtPoint(psiRe, w, h, x, y);
            var laplaceIm = calculateLaplacianAtPoint(psiIm, w, h, x, y);
            if (rounding > -1) {
                laplaceRe = math.round(laplaceRe, rounding);
                laplaceIm = math.round(laplaceIm, rounding);
            }
            psiRe[x*h + y] = psiRe[x*h + y] + (-factor) * laplaceIm + potential[x*h + y] * psiIm[x*h + y];
            psiIm[x*h + y] = psiIm[x*h + y] + factor * laplaceRe - potential[x*h + y] * psiRe[x*h + y];
            if (rounding > -1) {
                psiRe[x*h + y] = math.round(psiRe[x*h + y], rounding);
                psiIm[x*h + y] = math.round(psiIm[x*h + y], rounding);
            }
        }
    }
    console.log("Central value = " + psiRe[(w/2)*h + h/2])
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
    5);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        console.log("spacja")
        window.isRunning = window.isRunning ? false : true;
    }
  });