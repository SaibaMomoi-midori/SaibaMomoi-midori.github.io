
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>最近生成的CCB句子</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #667eea;
            color: white;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            width: 100%;
        }
        .sentence-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 15px;
        }
        .timestamp {
            font-size: 0.8em;
            color: #ffcc00;
        }
        .theme {
            font-size: 1em;
            font-weight: bold;
            color: #00e6ff;
        }
        .sentence {
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 5px;
        }
        .loading {
            text-align: center;
            margin-top: 10px;
            display: none;
        }
        .no-more {
            text-align: center;
            margin-top: 10px;
            color: #ff6666;
            display: none;
        }
        .comment-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 0.9em;
        }
        .comment-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .comment-count {
            font-size: 0.8em;
            color: #ccc;
            margin-top: 5px;
        }
        .comments-section {
            margin-top: 10px;
            display: none;
        }
        .comment {
            background: rgba(255, 255, 255, 0.1);
            padding: 8px;
            border-radius: 4px;
            margin-top: 5px;
            font-size: 0.9em;
        }
        .comment-timestamp {
            font-size: 0.7em;
            color: #ccc;
        }
        .comment-input {
            margin-top: 10px;
            width: 100%;
            display: flex;
        }
        .comment-input input {
            flex-grow: 1;
            padding: 8px;
            border: none;
            border-radius: 4px 0 0 4px;
            background: rgba(255, 255, 255, 0.9);
        }
        .comment-input button {
            padding: 8px 12px;
            border: none;
            background: #4CAF50;
            color: white;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
        }
        .comment-input button:hover {
            background: #45a049;
        }
    </style>
    <script>
        let page = 0;
        let loading = false;
        let hasMore = true;

        async function loadMore() {
            if (loading || !hasMore) return;
            loading = true;
            document.getElementById("loading").style.display = "block";

            const response = await fetch('/history_data', {
                method: 'POST',
                body: JSON.stringify({ page: page }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            const sentenceDiv = document.getElementById("sentences");
            data.forEach(line => {
                const card = document.createElement("div");
                card.className = "sentence-card";
                card.innerHTML = `
                    <p class="timestamp">${new Date(line[1] * 1000).toLocaleString()}</p>
                    <p class="theme">主题: ${line[2]}</p>
                    <p class="sentence">${line[3]}</p>
                    <p class="explanation">💡 ${line[4]}</p>
                    <div class="comment-count">${line[6]} 条评论</div>
                    <button class="comment-btn" onclick="toggleComments(${line[0]}, this)">查看评论</button>
                    <div class="comments-section" id="comments-${line[0]}"></div>
                `;
                sentenceDiv.appendChild(card);
            });

            if (data.length < 20) {
                hasMore = false;
                document.getElementById("no-more").style.display = "block";
            }

            page++;
            loading = false;
            document.getElementById("loading").style.display = "none";
        }

        async function toggleComments(sentenceId, button) {
            const commentsSection = document.getElementById(`comments-${sentenceId}`);

            if (commentsSection.style.display === "block") {
                commentsSection.style.display = "none";
                button.textContent = "查看评论";
                return;
            }

            button.textContent = "加载中...";
            commentsSection.style.display = "block";

            // Load existing comments
            const response = await fetch('/get_comments', {
                method: 'POST',
                body: JSON.stringify({ sentence_id: sentenceId }),
                headers: { 'Content-Type': 'application/json' }
            });
            const comments = await response.json();

            let commentsHTML = '';
            if (comments.length > 0) {
                comments.forEach(comment => {
                    commentsHTML += `
                        <div class="comment">
                            <p>${comment[3]}</p>
                            <p class="comment-timestamp">${new Date(comment[2] * 1000).toLocaleString()}</p>
                        </div>
                    `;
                });
            } else {
                commentsHTML = '<p>暂无评论</p>';
            }

            // Add input for new comment
            commentsHTML += `
                <div class="comment-input">
                    <input type="text" id="new-comment-${sentenceId}" placeholder="写下你的评论...">
                    <button onclick="postComment(${sentenceId}, this)">发送</button>
                </div>
            `;

            commentsSection.innerHTML = commentsHTML;
            button.textContent = "收起评论";
        }

        async function postComment(sentenceId, sendButton) {
            const commentInput = document.getElementById(`new-comment-${sentenceId}`);
            const commentText = commentInput.value.trim();

            if (!commentText) return;

            // Disable button during submission
            sendButton.disabled = true;
            sendButton.textContent = "发送中...";

            try {
                const response = await fetch('/post_comment', {
                    method: 'POST',
                    body: JSON.stringify({
                        sentence_id: sentenceId,
                        text: commentText
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Update comment count
                    const commentCountDiv = document.querySelector(`#comments-${sentenceId}`).previousElementSibling.previousElementSibling;
                    const currentCount = parseInt(commentCountDiv.textContent.split(" ")[0]);
                    commentCountDiv.textContent = `${currentCount + 1} 条评论`;

                    // Clear input
                    commentInput.value = '';

                    // Reload comments to show the new one
                    const commentsSection = document.getElementById(`comments-${sentenceId}`);
                    const commentButton = document.querySelector(`#comments-${sentenceId}`).previousElementSibling;
                    await toggleComments(sentenceId, commentButton);
                }
            } catch (error) {
                console.error("Error posting comment:", error);
            } finally {
                sendButton.disabled = false;
                sendButton.textContent = "发送";
            }
        }

        window.onload = function() {
            loadMore();
        };

        window.onscroll = function() {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                loadMore();
            }
        };
    </script>
</head>
<body>
    <div class="container">
        <h1>最近生成的 CCB 句子</h1>
        <div id="sentences"></div>
        <p id="loading" class="loading">⏳ 加载中...</p>
        <p id="no-more" class="no-more">没有更多句子</p>
    </div>
</body>
</html>
