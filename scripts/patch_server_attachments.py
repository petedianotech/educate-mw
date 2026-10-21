#!/usr/bin/env python3
"""Idempotent: add attachments support to server.ts chat handler."""
from pathlib import Path
import sys

p = Path("server.ts")
if not p.exists():
    print("no server.ts"); sys.exit(0)
t = p.read_text(encoding="utf-8")
if "attachments" in t and "userParts" in t:
    print("server attachments already present"); sys.exit(0)

old = """      const { messages, userMessage, useSearch, userLevel, isPro } = req.body;
      const isProUser = Boolean(isPro);

      const systemInstruction = getEmiSystemInstruction(userLevel, isProUser);

      const contents = [
        ...(messages || []).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text || '' }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage.text || '' }]
        }
      ];"""

new = """      const { messages, userMessage, useSearch, userLevel, isPro, attachments } = req.body;
      const isProUser = Boolean(isPro);

      let systemInstruction = getEmiSystemInstruction(userLevel, isProUser);
      if (Array.isArray(attachments) && attachments.length > 0) {
        systemInstruction += `\\n\\nWhen the student attaches images or PDF pages: carefully read any exam questions, diagrams, formulas, tables, or handwritten work. Extract the problem clearly, then solve step by step using KaTeX ($ and $$). If the image is notes, summarise and explain. If unclear, say what you can see and ask a short clarifying question.`;
      }

      const userParts: any[] = [{ text: userMessage?.text || '' }];
      if (Array.isArray(attachments)) {
        for (const att of attachments.slice(0, 3)) {
          if (!att?.data || !att?.mimeType) continue;
          if (String(att.mimeType).startsWith('image/')) {
            userParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
          } else if (att.mimeType === 'application/pdf') {
            userParts.push({ text: `[Attached PDF: ${att.name || 'document.pdf'} — ask student to paste key text if unreadable.]` });
          }
        }
      }

      const contents = [
        ...(messages || []).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text || '' }]
        })),
        {
          role: 'user',
          parts: userParts
        }
      ];"""

if old not in t:
    print("pattern not found - server may already differ"); sys.exit(0)
p.write_text(t.replace(old, new, 1), encoding="utf-8")
print("server.ts attachments patched")
