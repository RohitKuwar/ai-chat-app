import { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  useEffect(() => {
    if (isOpen) {
        setForm({
        name: "",
        email: "",
        password: ""
        });
        setErrors({});
        setIsLogin(true); // optional: always open in login mode
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
  const newErrors = {};

  if (!form.email) newErrors.email = "Email is required";
  if (!form.password) newErrors.password = "Password is required";

  if (!isLogin && !form.name) {
    newErrors.name = "Name is required";
  }

  return newErrors;
};

  const handleClose = () => {
    setForm({
        name: "",
        email: "",
        password: ""
    });
    setErrors({});
    setApiMessage("");
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
        ...prev,
        [name]: value
    }));

    // remove error instantly when user starts typing
    setErrors(prev => ({
        ...prev,
        [name]: ""
    }));

    // clear API error as well (optional but good UX)
    setApiMessage("");
    };

  const handleSubmit = async () => {
    setApiMessage("");
    setMessageType("");

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }

    setLoading(true);

    try {
        const url = isLogin ? "/api/auth/login" : "/api/auth/signup";

        const res = await axios.post(
        `${process.env.REACT_APP_API_URL}${url}`,
        form
        );

        if (isLogin) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onSuccess(res.data.user);
        onClose();
        } else {
        setApiMessage("Signup successful! Please login.");
        setMessageType("success");
        setIsLogin(true);
        }

    } catch (err) {
        setApiMessage(err.response?.data?.message || "Something went wrong");
        setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
};

  return (
    <div className="auth-overlay">
      <div className="auth-modal">

        <h2>{isLogin ? "Login" : "Signup"}</h2>

        {!isLogin && (
        <>
            <input name="name" placeholder="Name" onChange={handleChange} />
            {errors.name && <span className="error-text">{errors.name}</span>}
        </>
        )}

        <input name="email" placeholder="Email" onChange={handleChange} />
        {errors.email && <span className="error-text">{errors.email}</span>}

        <input name="password" type="password" placeholder="Password" onChange={handleChange} onKeyDown={handleKeyDown} />
        {errors.password && <span className="error-text">{errors.password}</span>}

        <button onClick={handleSubmit}>
          {loading ? (
            <span className="spinner"></span>
          ) : (
            isLogin ? "Login" : "Signup"
          )}
        </button>

        {/* <button type="submit" disabled={loading} onClick={handleSubmit}>
          {loading ? (
            <span className="spinner"></span>
          ) : (
            isLogin ? "Login" : "Signup"
          )}
        </button> */}

        <p>
          {isLogin ? "New user?" : "Already have account?"}
          <span onClick={() => setIsLogin(!isLogin)} style={{ textDecoration: "underline", cursor: "pointer" }}>
            {isLogin ? " Signup" : " Login"}
          </span>
        </p>

        {apiMessage && (
          <div className={`api-message ${messageType}`}>
            {apiMessage}
          </div>
        )}

        {/* <button className="close-btn" onClick={onClose}>✕</button> */}
        <X size={18} className="close-btn" onClick={handleClose} />
      </div>
    </div>
  );
};

export default AuthModal;
