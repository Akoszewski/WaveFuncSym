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

function initializeRandomNoise(width, height)
{
    const psi = new Array(height).fill(0).map(() => new Array(width).fill(0));
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            psi[y][x] = roundComplex(math.complex(Math.random() - 0.5, Math.random() - 0.5), 3);
        }
    }
    return psi;
}

function initializeGaussianWavepacket(width, height, center_x, center_y, sigma, init_momemtum_x, init_momentum_y, scalingConstant)
{
    let psiRe = new Array(height).fill(0).map(() => new Array(width).fill(0));
    let psiIm = new Array(height).fill(0).map(() => new Array(width).fill(0));
    var maxValRe = 0;
    var maxValIm = 0;
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            var initMomentums = math.complex(0, init_momemtum_x * x + init_momentum_y * y);
            var quotient = -((x-center_x)**2 + (y-center_y)**2)/4*sigma**2;
            var exponent = math.exp(math.multiply(math.add(quotient, initMomentums), scalingConstant));
            psiRe[y][x] = exponent.re;
            psiIm[y][x] = exponent.im;
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

function getInitialWaveFunction(w, h)
{
    return initializeGaussianWavepacket(w, h, w/2, h/2, 20, 2, 2, 0.001);
}

function calculateLaplacianAtPoint(func, x, y)
{
    return (func[x+1][y] - 2*func[x][y] + func[x-1][y] + func[x][y+1] - 2*func[x][y] + func[x][y-1]);
}

function getUpdatedWaveFunction(psi, reducedPlanckConstant, mass)
{
    var psiRe = psi[0];
    var psiIm = psi[1];
    var delta_t = 0.1;
    var width = psiRe.length - 1;
    var height = psiRe[0].length - 1;
    var factor = reducedPlanckConstant * delta_t / (2 * mass);
    for (let x = 1; x < width; x++)
    {
        for (let y = 1; y < height; y++)
        {
            // var laplaceRe = math.round(calculateLaplacianAtPoint(psiRe, x, y), 9);
            // var laplaceIm = math.round(calculateLaplacianAtPoint(psiIm, x, y), 9);
            var laplaceRe = calculateLaplacianAtPoint(psiRe, x, y);
            var laplaceIm = calculateLaplacianAtPoint(psiIm, x, y);
            // psiRe[x][y] = math.round((-factor) * laplaceIm, 9);
            // psiIm[x][y] = math.round(factor * laplaceRe, 9);
            psiRe[x][y] = -factor * laplaceIm;
            psiIm[x][y] = factor * laplaceRe;
            // console.log("factor = " + factor)
            // console.log("laplaceRe = " + laplaceRe)
            // console.log(psi[x][y])
        }
    }
    console.log("Value: " + psiRe[psiRe.length/2][psiRe[0].length/2])
    return [psiRe, psiIm];
}

function Draw(ctx, pixelBuffer, psiRe, psiIm, steps)
{
    for (var x = 0; x < ctx.canvas.width; x++)
    {
        for (var y = 0; y < ctx.canvas.height; y++)
        {
            const probability = psiRe[y][x] ** 2 + psiIm[y][x] ** 2;
            const r = Math.floor(255 * probability);
            const g = Math.floor(255 * probability);
            const b = 0;
            
            setPixel(ctx, pixelBuffer, x, y, [r, g, b, 255]);
        }
    }
    ctx.putImageData(pixelBuffer, 0, 0);
}

export function Play(ctx)
{
    const pixelBuffer = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    var steps = 0;
    var psi = Array()
    setInterval(() =>
    {
        if (steps == 0)
        {
            psi = getInitialWaveFunction(ctx.canvas.width, ctx.canvas.height);
        }
        else
        {
            psi = getUpdatedWaveFunction(psi, 1, 1);
        }
        console.log(steps)
        var psiRe = psi[0];
        var psiIm = psi[1];
        Draw(ctx, pixelBuffer, psiRe, psiIm, steps);
        steps = steps + 1;
    },
    1000);
}
