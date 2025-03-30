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
            psi[y][x] = math.complex(Math.random() - 0.5, Math.random() - 0.5);
        }
    }
    return psi;
}

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
    const amplitude = 0.5;
    return amplitude;
}

function UpdateSym(ctx, psi, time)
{
    psi = getUpdatedWaveFunction(psi);
    return psi;
}

function Draw(ctx, pixelBuffer, psi, time)
{
    for (var x = 0; x < ctx.canvas.width; x++)
    {
        for (var y = 0; y < ctx.canvas.height; y++)
        {
            const psiVal = psi[x][y];
            
            const probability = psiVal * psiVal;
            
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
    var psi = getInitialWaveFunction(ctx.canvas.width, ctx.canvas.height);
    var time = 0;
    setInterval(() =>
    {
        console.log(psi.length)
        psi = UpdateSym(ctx, psi, time)
        Draw(ctx, pixelBuffer, psi, time);
        time = time + 1;
    },
    50);
}
