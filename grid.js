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
    const psi = new Array(height).fill(0).map(() => new Array(width).fill(0));
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            var initMomentums = math.complex(0, init_momemtum_x * x + init_momentum_y * y);
            var quotient = -((x-center_x)**2 + (y-center_y)**2)/4*sigma**2;
            var exponent = math.exp(math.multiply(math.add(quotient, initMomentums), scalingConstant));
            // psi[x][y] = math.multiply(constant, exponent);
            psi[y][x] = exponent;
        }
    }
    return psi;
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
    return initializeGaussianWavepacket(w, h, w/2, h/2, 5, 2, 2, 0.001);
}

function getUpdatedWaveFunction(psi, reducedPlanckConstant, mass)
{
    var delta_t = 0.1;
    var width = psi.length - 1;
    var height = psi[0].length - 1;
    // width = 3;
    // height = 3;
    for (let x = 1; x < width; x++)
    {
        for (let y = 1; y < height; y++)
        {
            var factor = math.multiply(math.complex(0, 1), reducedPlanckConstant, delta_t, 1/(2 * mass));
            var laplace = math.add(psi[x+1][y], math.multiply(-2,psi[x][y]), psi[x-1][y], psi[x][y+1], math.multiply(-2, psi[x][y]), psi[x][y-1])
            psi[x][y] = roundComplex(math.add(psi[x][y], math.multiply(factor, laplace)), 3);
            // console.log("factor = " + factor)
            // console.log("laplace = " + laplace)
            // console.log(psi[x][y])
        }
    }
    return psi;
}

function Draw(ctx, pixelBuffer, psi, steps)
{
    for (var x = 0; x < ctx.canvas.width; x++)
    {
        for (var y = 0; y < ctx.canvas.height; y++)
        {
            const probability = math.pow(math.abs(psi[y][x]), 2);
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
    var psi = 0;
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
        // console.log(psi[8][8])
        Draw(ctx, pixelBuffer, psi, steps);
        steps = steps + 1;
    },
    50);
}
