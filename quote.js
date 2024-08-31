async function makeQuote(postid) {
    const data = await fetch(`https://api.meower.org/posts?id=${postid}`).then(res => res.json());
    const avatarUrl = `https://uploads.meower.org/icons/${data.author.avatar}`;
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'Anonymous';
    avatarImg.src = avatarUrl;
    const image = new Promise((resolve, reject) => {
        avatarImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const canvasWidth = 1280;
            const canvasHeight = 720;
            const padding = 20;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Fill background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw avatar image
            ctx.drawImage(avatarImg, 0, 0, canvasHeight, canvasHeight);

            // Convert avatar to grayscale
            const imageData = ctx.getImageData(0, 0, canvasHeight, canvasHeight);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                imageData.data[i] = avg;
                imageData.data[i + 1] = avg;
                imageData.data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth * 1, canvasHeight * 0.5);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, '#000');
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Wrap text
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 64px sans-serif';
            const text = data.p;
            const maxWidth = canvasWidth - canvasHeight - 2 * padding;
            const lineHeight = 72;
            let y = canvasHeight / 2;
            const lines = [];
            let currentLine = '';
            const words = text.split(' ');

            for (const word of words) {
                const testLine = currentLine + word + ' ';
                const testWidth = ctx.measureText(testLine).width;
                if (testWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            // Adjust vertical position for centered text
            y -= ((lines.length - 1) * lineHeight) / 2;

            // Draw wrapped text
            lines.forEach((line) => {
                ctx.fillText(line, canvasHeight + padding, y);
                y += lineHeight;
            });

            // Draw username below the quote
            ctx.font = 'italic 32px sans-serif';
            ctx.globalAlpha = 0.8;
            ctx.fillText(`- ${data.author._id}`, canvasHeight + padding, y + 30);

            // Add watermark
            ctx.globalAlpha = 0.15;
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#eee';
            ctx.fillText('Make it a quote by @Eris', canvasWidth - 180, canvasHeight - 12);

            resolve(canvas.toDataURL());
        };
        avatarImg.onerror = () => {
            reject(new Error('Image failed to load'));
        };
    });

    try {
        const url = await image;
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-${postid}.png`;
        link.click();
    } catch (err) {
        console.error(err);
    }
}

const actuallysendpost = sendpost;
sendpost = async function() {
    const msgbox = document.getElementById('msg');
    const message = msgbox.value.trim();
    
    if (message.startsWith('/')) {
        const command = message.split(' ')[0].substring(1);
        
        if (command === 'quote') {
            const replies = document.getElementById("replies");
            const replyContainer = replies.firstChild;
            
            if (replyContainer) {
                const replyId = replyContainer.getAttribute("data-reply-id");
                if (replyId) {
                    const msgbox = document.getElementById('msg');
                    const message = msgbox.value.trim();
                    msgbox.value = "";
                    autoresize();
                    localStorage.removeItem(`draft-${page}`);

                    const replies = document.getElementById("replies");
                    replies.innerHTML = "";
                    
                    await makeQuote(replyId);

                    if (!message.trim() && (editIndicator.hasAttribute("data-postid") || pendingAttachments.length < 1)) {
                        console.log("The message is blank.");
                        return;
                    }
                    return;
                }
            }
        }
    }
    
    actuallysendpost();
};