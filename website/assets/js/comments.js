//Comments.js | Comment system for noskid with enhanced CSS

function spawnCommentSystem(event) {
    event.preventDefault();

    startAchievement('Super Commenter');

    const commentwin = ClassicWindow.createWindow({
        title: 'Comments',
        width: 500,
        height: 400,
        x: Math.round((window.innerWidth - 500) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        content: `<div class="comments-loading">
            <div class="loading-spinner"></div>
            <p>Loading comments...</p>
        </div>`,
        theme: 'dark',
        resizable: false,
    });

    let footer = commentwin.querySelector('.window-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'window-footer';
        commentwin.appendChild(footer);
    }

    const newCommentBtn = document.createElement('button');
    newCommentBtn.textContent = 'New Comment';
    newCommentBtn.className = 'new-comment-btn';
    newCommentBtn.addEventListener('click', () => spawnNewCommentForm());
    footer.prepend(newCommentBtn);

    addCommentSystemStyles();

    loadComments(commentwin);
    return commentwin;
}

function addCommentSystemStyles() {
    if (document.getElementById('comment-system-styles')) return;

    const style = document.createElement('style');
    style.id = 'comment-system-styles';
    style.textContent = `
        .comments-container {
            padding: 15px;
            background: #1a1a1a;
            color: #e0e0e0;
            height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
        }

        .comments-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #888;
        }

        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #333;
            border-top: 2px solid #007acc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .comment {
            background: #2d2d2d;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
            position: relative;
        }

        .comment:hover {
            border-color: #007acc;
            box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #404040;
        }

        .comment-author {
            font-weight: bold;
            color: #007acc;
            font-size: 14px;
        }

        .comment-date {
            color: #888;
            font-size: 12px;
        }

        .comment-content {
            line-height: 1.5;
            margin: 12px 0;
            color: #e0e0e0;
            word-wrap: break-word;
        }

        .comment-reactions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #404040;
        }

        .reaction-btn {
            background: #404040;
            border: 1px solid #555;
            color: #e0e0e0;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .reaction-btn:hover {
            background: #4a4a4a;
            border-color: #666;
        }

        .reaction-btn.like-btn {
            border-color: #28a745;
        }

        .reaction-btn.dislike-btn {
            border-color: #dc3545;
        }

        .reaction-btn.like-btn.active {
            background: #28a745;
            color: white;
        }

        .reaction-btn.dislike-btn.active {
            background: #dc3545;
            color: white;
        }

        .reaction-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .no-comments {
            text-align: center;
            color: #888;
            padding: 40px 20px;
            font-style: italic;
        }

        .no-comments .icon {
            font-size: 48px;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .error-message {
            background: #4a1a1a;
            border: 1px solid #8b0000;
            border-radius: 4px;
            padding: 15px;
            color: #ff6b6b;
            text-align: center;
        }

        .retry-btn {
            background: #007acc;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.2s ease;
        }

        .retry-btn:hover {
            background: #0056b3;
        }

        .new-comment-btn {
            background: #007acc;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s ease;
        }

        .new-comment-btn:hover {
            background: #0056b3;
        }

        .comment-form {
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-weight: bold;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            background: #2d2d2d;
            border: 1px solid #404040;
            border-radius: 4px;
            color: #e0e0e0;
            font-family: inherit;
            box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .form-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s ease;
        }

        .form-btn.primary {
            background: #007acc;
            color: white;
        }

        .form-btn.primary:hover {
            background: #0056b3;
        }

        .form-btn.secondary {
            background: #6c757d;
            color: white;
        }

        .form-btn.secondary:hover {
            background: #545b62;
        }

        .form-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .comments-container::-webkit-scrollbar {
            width: 8px;
        }

        .comments-container::-webkit-scrollbar-track {
            background: #1a1a1a;
        }

        .comments-container::-webkit-scrollbar-thumb {
            background: #404040;
            border-radius: 4px;
        }

        .comments-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    `;

    document.head.appendChild(style);
}

function loadComments(commentwin) {
    fetch('/api/comments/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network error when fetching comments');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                displayComments(commentwin, data);
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            const errorContent = document.createElement('div');
            errorContent.className = 'comments-container';
            errorContent.innerHTML = `
                <div class="error-message">
                    <p>Error loading comments: ${error.message}</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;

            updateComments(commentwin, errorContent);

            const retryBtn = errorContent.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadComments(commentwin));
            }

            log('Error loading comments: ' + error.message, 'error');
        });
}

function displayComments(window, comments) {
    const container = document.createElement('div');
    container.className = 'comments-container';

    if (comments.length === 0) {
        container.innerHTML = `
            <div class="no-comments">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        updateComments(window, container);
        return;
    }

    const commentsHTML = comments.map(comment => {
        const userLiked = comment.user_reaction === 'like';
        const userDisliked = comment.user_reaction === 'dislike';

        return `
        <div class="comment" data-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${comment.author || 'Anonymous'}</span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-reactions">
                <button class="reaction-btn like-btn ${userLiked ? 'active' : ''}" 
                        onclick="handleReaction(${comment.id}, '${userLiked ? 'none' : 'like'}')">
                    + ${comment.likes || 0}
                </button>
                <button class="reaction-btn dislike-btn ${userDisliked ? 'active' : ''}" 
                        onclick="handleReaction(${comment.id}, '${userDisliked ? 'none' : 'dislike'}')">
                    - ${comment.dislikes || 0}
                </button>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = commentsHTML;
    updateComments(window, container);
    log('Comments loaded successfully', 'success');
}

function updateComments(window, content) {
    if (content instanceof HTMLElement) {
        ClassicWindow.updateWindowContent(window, content);
    } else {
        const newContent = document.createElement('div');
        newContent.innerHTML = content;
        ClassicWindow.updateWindowContent(window, newContent);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function handleReaction(commentId, reactionType) {
    const commentElement = document.querySelector(`.comment[data-id="${commentId}"]`);
    if (!commentElement) return;

    const likeBtn = commentElement.querySelector('.like-btn');
    const dislikeBtn = commentElement.querySelector('.dislike-btn');

    // Disable buttons during request
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;

    fetch(`/api/comments/?action=${reactionType}&id=${commentId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error handling reaction');
                });
            }
            return response.json();
        })
        .then(data => {
            likeBtn.innerHTML = `+ ${data.likes || 0}`;
            dislikeBtn.innerHTML = `- ${data.dislikes || 0}`;

            likeBtn.classList.toggle('active', data.user_reaction === 'like');
            dislikeBtn.classList.toggle('active', data.user_reaction === 'dislike');

            likeBtn.setAttribute('onclick', `handleReaction(${commentId}, '${data.user_reaction === 'like' ? 'none' : 'like'}')`);
            dislikeBtn.setAttribute('onclick', `handleReaction(${commentId}, '${data.user_reaction === 'dislike' ? 'none' : 'dislike'}')`);

            log('Reaction updated successfully', 'success');
        })
        .catch(error => {
            alert('Error: ' + error.message);
            log('Error handling reaction: ' + error.message, 'error');
        })
        .finally(() => {
            // Re-enable buttons
            likeBtn.disabled = false;
            dislikeBtn.disabled = false;
        });
}

function spawnNewCommentForm() {
    const newCommentWin = ClassicWindow.createWindow({
        title: 'New Comment',
        width: 400,
        height: 300,
        x: Math.round((window.innerWidth - 400) / 2),
        y: Math.round((window.innerHeight - 300) / 2),
        content: `
            <div class="comment-form">
                <form>
                    <div class="form-group">
                        <label for="author">Your name:</label>
                        <input type="text" id="author" placeholder="Anonymous">
                    </div>
                    <div class="form-group">
                        <label for="content">Comment:</label>
                        <textarea id="content" required rows="5" placeholder="Write your comment here..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="form-btn secondary cancel">Cancel</button>
                        <button type="submit" class="form-btn primary">Send Comment</button>
                    </div>
                </form>
            </div>
        `,
        theme: 'dark',
        resizable: false,
        statusText: 'Writing a new comment',
    });

    const form = newCommentWin.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitComment(form, newCommentWin);
    });

    const cancelBtn = newCommentWin.querySelector('.cancel');
    cancelBtn.addEventListener('click', () => {
        ClassicWindow.closeWindow(newCommentWin);
    });

    return newCommentWin;
}

function submitComment(form, window) {
    const author = form.querySelector('#author').value.trim() || 'Anonymous';
    const content = form.querySelector('#content').value.trim();

    if (!content) {
        alert('Comment content cannot be empty.');
        return;
    }

    if (author.toLowerCase() == "bypass" || content.toLowerCase() == "bypass") {
        ClassicWindow.createWindow({
            title: "Hey !",
            content: '<h1 style="color: red;">You have to write bypass <b>on the website</b>, not in a comment &gt;:[</h1>',
            theme: 'dark',
            width: 0, //auto min value
            height: 0, //auto min value
            x: Math.round((window.innerWidth - 600) / 2),
            y: Math.round((window.innerHeight - 450) / 2),
        });

        return;
    }

    const buttons = form.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    const commentData = {
        author: author,
        content: content
    };

    fetch('/api/comments/index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error sending comment');
                });
            }
            return response.json();
        })
        .then(data => {
            log('Comment added successfully', 'success');
            addAchievement('Super Commenter');

            const allWindows = ClassicWindow.getAllWindows();

            allWindows.forEach(win => {
                const titleElement = win.querySelector('.c-t');
                if (titleElement && titleElement.textContent === 'Comments') {
                    loadComments(win);
                }
            });

            ClassicWindow.closeWindow(window);

        })
        .catch(error => {
            log('Error sending comment: ' + error.message, 'error');
            alert('Error: ' + error.message);

            buttons.forEach(btn => btn.disabled = false);
        });
}