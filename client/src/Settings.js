import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Palette, Mic, Thermometer, Bot, ChevronDown, Check } from 'lucide-react'
import axios from 'axios'

const THEME_OPTIONS = [
  // ── Dark ──
  { value: 'dark-navy',       label: '🌑 Custom Dark Navy' },
  { value: 'pure-black',      label: '⚫ Pure Black' },
  { value: 'slate-gray',      label: '🩶 Slate Gray' },
  { value: 'dark-mocha',      label: '🟤 Dark Mocha' },
  { value: 'obsidian-warm',   label: '🔥 Obsidian Warm' },
  { value: 'midnight-green',  label: '🌿 Midnight Green' },
  // ── Light ──
  { value: 'light',           label: '☀️  Light Mode' },
  { value: 'soft-white',  label: '🤍 Soft White' },
  { value: 'paper',           label: '📄 Paper' },
  { value: 'cherry-blossom',  label: '🌸 Cherry Blossom' },
  { value: 'sky',             label: '🩵 Sky' },
  { value: 'fresh-mint',  label: '🌿 Fresh Mint' },
  { value: 'peach',       label: '🍊 Peach' },
  // ── Special ──
  { value: 'cyberpunk',       label: '🟣 Cyberpunk' },
  { value: 'hacker',      label: '⚡ Hacker' },
]

const LLM_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT 4o-mini' },
]

const TEMPERATURE_OPTIONS = [
  { value: 0, label: '0.0 — Deterministic' },
  { value: 0.3, label: '0.3 — Focused' },
  { value: 0.5, label: '0.5 — Balanced' },
  { value: 0.7, label: '0.7 — Creative' },
  { value: 1, label: '1.0 — Very Creative' },
]

// ── Reusable dropdown with smart flip ──
function SettingSelect({ value, options, onChange, keyField = 'label', open, onToggle, btnRef }) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 240
      const openUpward = spaceBelow < menuHeight
      const isMobile = window.innerWidth <= 768

      setMenuPos({
        top: openUpward
          ? Math.max(8, rect.top - menuHeight - 6)
          : rect.bottom + 6,
        left: isMobile ? 16 : rect.left,
        width: isMobile ? window.innerWidth - 32 : rect.width,
      })
    }
    onToggle()
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) onToggle()
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Close on scroll/resize
  // useEffect(() => {
  //   if (!open) return
  //   const handler = () => onToggle()
  //   window.addEventListener('scroll', handler, true)
  //   window.addEventListener('resize', handler)
  //   return () => {
  //     window.removeEventListener('scroll', handler, true)
  //     window.removeEventListener('resize', handler)
  //   }
  // }, [open])

  const selected = options.find(o => o[keyField] === value)

  return (
    <>
      <button
        ref={btnRef}
        className="setting-dropdown-btn"
        onClick={handleToggle}
        title={selected?.[keyField] || ''}
      >
        <span className="setting-dropdown-selected">
          {selected?.[keyField] || 'Select...'}
        </span>
        <ChevronDown size={14} className={`setting-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="setting-dropdown-menu"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            zIndex: 9999,
          }}
        >
          {options.map(opt => (
            <button
              key={opt[keyField]}
              className={`setting-dropdown-item ${value === opt[keyField] ? 'active' : ''}`}
              onClick={() => { onChange(opt); onToggle(); }}
            >
              <span className="setting-item-label">{opt[keyField]}</span>
              {value === opt[keyField] && <Check size={13} className="setting-check" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

function Settings({ onClose, token, settings, setSettings, theme, onThemeChange, voices, selectedVoice, setSelectedVoice, handleVoiceChange }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [llmOpen, setLlmOpen] = useState(false);
  const [tempOpen, setTempOpen] = useState(false);

  const [themeName, setThemeName] = useState('');
  // const [voiceName, setVoiceName] = useState('');
  const [llmName, setLlmName] = useState('');
  const [temperature, setTemperature] = useState(0);

  const themeBtnRef = useRef(null);
  const voiceBtnRef = useRef(null);
  const llmBtnRef = useRef(null);
  const tempBtnRef = useRef(null);

  useEffect(() => {
    if (!settings) return;

    setThemeName(settings.theme);
    setLlmName(settings.model);
    setTemperature(settings.temperature);
  }, [settings]);

  const updateSettings = async (payload) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/settings`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSettings(res.data.settings);
    } catch (error) {
      console.error(error);
    }
  };

  // Close others when one opens
  const closeAll = () => {
    setThemeOpen(false)
    setVoiceOpen(false)
    setLlmOpen(false)
    setTempOpen(false)
  }

  const toggle = (setter, current) => {
    closeAll()
    setter(!current)
  }

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="settings-header">
          <div className="settings-header-left">
            <h2 className="settings-title">Settings</h2>
            <p className="settings-subtitle">Customize your AI Chat Studio experience</p>
          </div>
          <button className="settings-close" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="settings-body">

          {/* Theme */}
          <div className="setting-row">
            <div className="setting-row-left">
              <div className="setting-icon-wrap"><Palette size={16} /></div>
              <div className="setting-info">
                <p className="setting-label">Theme</p>
                <p className="setting-desc">Choose your preferred color theme</p>
              </div>
            </div>
            <div className="setting-row-right">
              <div className="setting-dropdown-wrap">
                <SettingSelect
                  value={THEME_OPTIONS.find(t => t.value === themeName)?.label || ''}
                  options={THEME_OPTIONS}
                  onChange={(opt) => {
                    setThemeName(opt.value);
                    onThemeChange(opt.value);
                    updateSettings({
                      theme: opt.value
                    })
                  }}
                  open={themeOpen}
                  onToggle={() => toggle(setThemeOpen, themeOpen)}
                  btnRef={themeBtnRef}
                />
              </div>
            </div>
          </div>

          {/* Voice Model */}
          <div className="setting-row">
            <div className="setting-row-left">
              <div className="setting-icon-wrap"><Mic size={16} /></div>
              <div className="setting-info">
                <p className="setting-label">Voice Model</p>
                <p className="setting-desc">Browser speech assistant for reading responses</p>
              </div>
            </div>
            <div className="setting-row-right">
              <div className="setting-dropdown-wrap">
                <SettingSelect
                  value={selectedVoice?.name || ""}
                  options={voices.map(v => ({ label: v.name, value: v.name, _voice: v }))}
                  onChange={(opt) => {
                    // setVoiceName(opt.label);
                    setSelectedVoice(opt._voice);
                    handleVoiceChange(opt._voice.voiceURI);
                  }}
                  open={voiceOpen}
                  onToggle={() => toggle(setVoiceOpen, voiceOpen)}
                  btnRef={voiceBtnRef}
                />
              </div>
            </div>
          </div>

          {/* LLM Model */}
          <div className="setting-row">
            <div className="setting-row-left">
              <div className="setting-icon-wrap"><Bot size={16} /></div>
              <div className="setting-info">
                <p className="setting-label">LLM Model</p>
                <p className="setting-desc">Choose which AI model powers your conversations</p>
              </div>
            </div>
            <div className="setting-row-right">
              <div className="setting-dropdown-wrap">
                <SettingSelect
                  value={LLM_OPTIONS.find(l => l.value === llmName)?.label || ''}
                  options={LLM_OPTIONS}
                  onChange={(opt) => {
                    setLlmName(opt.value);
                    updateSettings({
                      model: opt.value,
                    });
                  }}
                  open={llmOpen}
                  onToggle={() => toggle(setLlmOpen, llmOpen)}
                  btnRef={llmBtnRef}
                />
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="setting-row">
            <div className="setting-row-left">
              <div className="setting-icon-wrap"><Thermometer size={16} /></div>
              <div className="setting-info">
                <p className="setting-label">Temperature</p>
                <p className="setting-desc">Controls creativity of responses. Lower = precise, Higher = creative</p>
              </div>
            </div>
            <div className="setting-row-right">
              <div className="setting-dropdown-wrap">
                <SettingSelect
                  value={TEMPERATURE_OPTIONS.find(l => l.value === temperature)?.label || 0}
                  options={TEMPERATURE_OPTIONS}
                  onChange={(opt) => {
                    setTemperature(opt.value);
                    updateSettings({
                      temperature: Number(opt.value),
                    });
                  }}
                  open={tempOpen}
                  onToggle={() => toggle(setTempOpen, tempOpen)}
                  btnRef={tempBtnRef}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="settings-footer">
          <p className="settings-footer-note">Settings are saved automatically.</p>
          <button className="settings-done-btn" onClick={onClose}>Done</button>
        </div>

      </div>
    </div>
  )
}

export default Settings