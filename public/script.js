// script.js

// 导航栏动态显示
const token = localStorage.getItem('token');
if(token){
    // 登录状态
    document.getElementById('loginLink').innerHTML = '<a href="#">登出</a>';
    document.getElementById('registerLink').style.display = 'none';
    // 检查用户角色
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            if(data.role === 'admin'){
                // 显示发布新帖子链接
                document.getElementById('newPostLink').style.display = 'block';
            }
        }
    })
    .catch(error => console.error('Error:', error));
} else {
    // 未登录状态
    document.getElementById('newPostLink').style.display = 'none';
    document.getElementById('loginLink').innerHTML = '<a href="login.html">登录</a>';
    document.getElementById('registerLink').style.display = 'block';
}

// 登出功能
document.getElementById('loginLink').addEventListener('click', function(e){
    if(e.target.tagName === 'A'){
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
});

// 获取最新帖子
function getLatestThreads() {
    fetch('/threads', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            const threadsList = document.getElementById('latestThreadsList');
            data.posts.slice(0, 5).forEach(post => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="post.html?id=${post.id}">${post.title}</a>`;
                threadsList.appendChild(li);
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

// 获取所有帖子
function getThreads() {
    fetch('/threads', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            const threadsList = document.getElementById('threadsList');
            data.posts.forEach(post => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="post.html?id=${post.id}">${post.title}</a> by ${post.author}`;
                threadsList.appendChild(li);
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

// 获取帖子详情
function getPost() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    fetch(`/post?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            const postContent = document.getElementById('postContent');
            postContent.innerHTML = `<h2>${data.post.title}</h2>
                                      <p>作者: ${data.post.author} 发布于: ${data.post.date}</p>
                                      <p>${data.post.content}</p>`;
            const commentsList = document.getElementById('commentsList');
            data.post.comments.forEach(comment => {
                const li = document.createElement('li');
                li.innerHTML = `<p>${comment.author}: ${comment.content}</p>`;
                commentsList.appendChild(li);
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

// 处理评论提交
document.getElementById('commentForm').addEventListener('submit', function(e){
    e.preventDefault();
    const commentText = document.getElementById('commentText').value;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    const token = localStorage.getItem('token');
    fetch('/comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id, comment: commentText })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            alert('评论提交成功');
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// 处理新帖子发布
document.getElementById('newPostForm').addEventListener('submit', function(e){
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const token = localStorage.getItem('token');
    fetch('/newpost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ title, content })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            alert('发布成功');
            window.location.href = 'threads.html';
        } else {
            document.getElementById('newPostMessage').innerText = data.message;
        }
    })
    .catch(error => console.error('Error:', error));
}