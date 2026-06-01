// CodeBlock.js
import { useState } from "react";
import { Copy, Check, CodeXml } from "lucide-react";

function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Inline code (single backtick) ──
  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  // ── Block code (triple backtick) ──
  const language = className?.replace("language-", "") || "text";

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="lang"><CodeXml size={14} color={"#6366f1"} /> <span>{language}</span></span>
        <button className="copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="code-pre">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default CodeBlock;