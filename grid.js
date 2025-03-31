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
    return initializeRandomNoise(w, h);
}

function getUpdatedWaveFunction(psi)
{
    // const centerX = width / 2;
    // const centerY = height / 2;
    
    // // Odległość od środka (normalizowana)
    // const dx = (x - centerX) / (width * 0.2);
    // const dy = (y - centerY) / (height * 0.2);
    
    // // Amplituda = Gaussa * oscylacja w czasie
    // const amplitude = Complex.exp(-(dx * dx + dy * dy)) * Math.cos(time * 0.1);
    for (let x = 0; x < psi.length; x++)
    {
        for (let y = 0; y < psi[0].length; y++)
        {
            psi[x][y].re += 0.1;
        }
    }
    return psi;
}

function Draw(ctx, pixelBuffer, psi, time)
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
    var time = 0;
    var psi = 0;
    setInterval(() =>
    {
        if (time == 0)
        {
            psi = getInitialWaveFunction(ctx.canvas.width, ctx.canvas.height);
        }
        else
        {
            psi = getUpdatedWaveFunction(psi);
        }
        console.log(time)
        // const probability = math.multiply(math.abs(psi[10][10]), math.abs(psi[10][10]));
        Draw(ctx, pixelBuffer, psi, time);
        time = time + 1;
    },
    50);
}
