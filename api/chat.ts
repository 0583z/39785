import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * [技术路径说明] 
 * 1. 采用 OpenAI 兼容协议接入 DeepSeek-V3/R1 模型，确立标准化接口。
 * 2. 优化：在后端强制开启 response_format: { type: 'json_object' }，
 *    通过引擎级约束确保输出 100% 可被系统解析，减少前端 JSON Parse 异常。
 * 3. 安全方案：API Key 仅在服务端从进程变量获取，前端不暴露私钥。
 */

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rawText, mode = 'extract' } = req.body;

  if (!rawText) {
    return res.status(400).json({ error: '请提供输入文本内容。' });
  }

  try {
    const systemPrompts = {
      extract: `你是一个专业的大学竞赛数据提取助手。从输入的文本中提取最精准的竞赛核心数据。输出严格 JSON。
      结构：{ "title": "比赛名称", "deadline": "YYYY-MM-DD", "category": "学科技术/创新创业/艺术传媒/综合类", "link": "链接", "description": "20-50字简介" }`,
      strategy: `你是一个资深的计算机专业竞赛教练。针对用户提供的比赛信息，生成一段“针对 CS 专业学生的提分攻略”。
      字数要求：50-80字。
      要求：直接给出建议，包含技术栈建议、组队策略或核心提分点。
      输出格式：JSON 对象。结构：{ "strategy": "攻略内容" }`
    };

    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.extract
        },
        { role: 'user', content: rawText }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    const result = JSON.parse(content || '{}');
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('DeepSeek Server Error:', error);
    return res.status(500).json({ error: 'AI 解析引擎暂不可用，请稍后再试。' });
  }
}
