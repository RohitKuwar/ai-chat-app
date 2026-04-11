import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

const CodeBlock = ({ inline, className, children }) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const code = String(children).replace(/\n$/, "");

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  if (inline) {
    return <code>{children}</code>;
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="lang">{language}</span>

        <button onClick={handleCopy} className="copy-btn">
          {copied ? (
            <Check size={16} strokeWidth={2.5} />
          ) : (
            <Copy size={16} strokeWidth={2} />
          )}
        </button>
      </div>

      <SyntaxHighlighter
        style={nightOwl}
        language={language}
        PreTag="div"
        customStyle={{
          background: "transparent",
          margin: 0,
          padding: "12px",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;