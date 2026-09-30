# 愿望实现机 · Wish Machine

赛博讨口子：缺 token 的人挂出 idea / prompt，token 菩萨帮忙实现，把作品链接留在评论区。

Next.js 16 (App Router) · Supabase (Auth + Postgres + RLS) · Tailwind CSS 4 + shadcn/ui 风格组件 · next-intl（中文 / English）

## 本地开发

1. 在 Supabase 新建项目，打开 SQL Editor，执行 `supabase/migrations/20260930000000_init.sql`。
   （或使用 Supabase CLI：`supabase link` 后 `supabase db push`。）
2. 复制 `.env.example` 为 `.env.local`，填入 Project Settings → API 里的 URL 和 publishable（anon）key。
3. `npm install && npm run dev`

## 部署到 Vercel

- 导入仓库，在 Project Settings → Environment Variables 添加 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
- 在 Supabase → Authentication → URL Configuration 把 Site URL 设成 Vercel 域名，并把 `https://<你的域名>/auth/callback` 加到 Redirect URLs。

## 可选：人机验证和内容审核

- **Cloudflare Turnstile**：在 Cloudflare 后台创建 widget，把 site key 设为 Vercel 环境变量 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 并重新部署；然后在 Supabase → Authentication → Attack Protection 打开 CAPTCHA，选 Turnstile，填 secret key。顺序不能反，否则登录会失败。
- **OpenAI moderation**：把 API key 设为 Vercel 环境变量 `OPENAI_API_KEY`（只在服务器端使用）。没有设置时跳过审核。

## 功能

- 邮箱注册 / 登录（注册时填写昵称）
- 发布心愿（标题 + 详情/prompt），首页瀑布流，按「赞 + 评论数」排序，也可按最新
- 点赞 / 取消点赞，评论（可附作品链接）
- 个人中心：我发布的、我点赞的、我评论的
- 中英文切换（记在 cookie，首次访问按浏览器语言）
- 心愿最多 4 张配图、评论 1 张图，浏览器端压缩成 WebP 后存进 Supabase Storage
- 发布前用 OpenAI moderation 审核文字和图片
- 举报按钮：被 3 个人举报的心愿或评论自动隐藏（作者本人仍可见）
