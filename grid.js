function setPixel(ctx, pixelBuffer, x, y, color = [0, 0, 0, 255])
{
    const index = (y * ctx.canvas.width + x) * 4;
    pixelBuffer.data[index] = color[0];     // R
    pixelBuffer.data[index + 1] = color[1]; // G
    pixelBuffer.data[index + 2] = color[2]; // B
    pixelBuffer.data[index + 3] = color[3]; // A
}

function waveFunction(x, y, time, width, height)
{
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Odległość od środka (normalizowana)
    const dx = (x - centerX) / (width * 0.2);
    const dy = (y - centerY) / (height * 0.2);
    
    // Amplituda = Gaussa * oscylacja w czasie
    const amplitude = Math.exp(-(dx * dx + dy * dy)) * Math.cos(time * 0.1);
    return amplitude;
}


function Draw(ctx, pixelBuffer, time)
{
    for (var x = 0; x < ctx.canvas.width; x++)
    {
        for (var y = 0; y < ctx.canvas.height; y++)
        {
            const psi = waveFunction(x, y, time, ctx.canvas.width, ctx.canvas.height);
            
            const probability = psi * psi;
            
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
    let time = 0;
    setInterval(() => { Draw(ctx, pixelBuffer, time); time = time + 1;}, 50);
}
