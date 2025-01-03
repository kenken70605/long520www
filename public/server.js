// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// 数据库文件路径
const usersPath = path.join(__dirname, 'users.json');
const postsPath = path.join(__dirname, 'posts.json');

// 初始化用户数据
function initUsers() {
    if (!fs.existsSync(usersPath)) {
        // 创建管理员账户
        const adminPassword = '!751125syt';
        const saltRounds = 10;
        bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
            if (err) {
                console.error('Error hashing admin password:', err);
                return;
            }
            const adminUser = { username: 'admin', password: hash, role: 'admin' };
            fs.writeFileSync(usersPath, JSON.stringify([adminUser], null, 2));
            console.log('管理员账户已创建');
        });
    }
}

// 初始化帖子数据
function initPosts() {
    if (!fs.existsSync(postsPath)) {
        fs.writeFileSync(postsPath, JSON.stringify([]));
    }
}

// 启动时初始化
initUsers();
initPosts();

// 注册用户
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users file:', err);
            return res.json({ success: false, message: '注册失败' });
        }
        const users = JSON.parse(data);
        const userExists = users.find(user => user.username === username);
        if(userExists){
            return res.json({ success: false, message: '用户名已存在' });
        }
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                return res.json({ success: false, message: '注册失败' });
            }
            const newUser = { username, password: hash, role: 'user' };
            users.push(newUser);
            fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    console.error('Error writing users file:', err);
                    return res.json({ success: false, message: '注册失败' });
                }
                res.json({ success: true });
            });
        });
    });
});

// 登录用户
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users file:', err);
            return res.json({ success: false, message: '登录失败' });
        }
        const users = JSON.parse(data);
        const user = users.find(user => user.username === username);
        if(user){
            bcrypt.compare(password, user.password, (err, result) => {
                if(err){
                    return res.json({ success: false, message: '登录失败' });
                }
                if(result){
                    const token = jwt.sign({ username: user.username, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
                    res.json({ success: true, token, role: user.role });
                } else {
                    res.json({ success: false, message: '密码错误' });
                }
            });
        } else {
            res.json({ success: false, message: '用户不存在' });
        }
    });
});

// 中间件验证JWT
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.json({ success: false, message: '没有权限' });

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.json({ success: false, message: '无效的token' });
        req.user = user;
        next();
    });
}

// 发布新帖子
app.post('/newpost', verifyToken, (req, res) => {
    if(req.user.role !== 'admin'){
        return res.json({ success: false, message: '没有权限发布帖子' });
    }
    const { title, content } = req.body;
    fs.readFile(postsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading posts file:', err);
            return res.json({ success: false, message: '发布失败' });
        }
        const posts = JSON.parse(data);
        const post = { title, content, author: req.user.username, date: new Date() };
        posts.push(post);
        fs.writeFile(postsPath, JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                console.error('Error writing posts file:', err);
                return res.json({ success: false, message: '发布失败' });
            }
            res.json({ success: true });
        });
    });
});

// 获取所有帖子
app.get('/threads', (req, res) => {
    fs.readFile(postsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading posts file:', err);
            return res.json({ success: false, message: '获取帖子失败' });
        }
        const posts = JSON.parse(data);
        res.json({ success: true, posts });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});