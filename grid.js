function setPixel(ctx, pixelBuffer, x, y, color = [0, 0, 0, 255])
{
    const index = (y * ctx.canvas.width + x) * 4;
    pixelBuffer.data[index] = color[0];     // R
    pixelBuffer.data[index + 1] = color[1]; // G
    pixelBuffer.data[index + 2] = color[2]; // B
    pixelBuffer.data[index + 3] = color[3]; // A
}

function Draw(ctx, pixelBuffer, time)
{
    let r = 255;
    let g = 125;
    let b = 0;

    for (var x = 0; x < ctx.canvas.width; x++)
    {
        r = time * 3 % 256;
        for (var y = 0; y < ctx.canvas.height; y++)
        {
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
