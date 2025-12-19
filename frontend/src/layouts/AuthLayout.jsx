// src/layouts/AuthLayout.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import googleIcon from "../assets/google-icon.png";
import vnIcon from "../assets/vn.png";
import microsoftIcon from "../assets/microsoft-icon.png";
import "./AuthLayout.css";
import { loginApi, registerApi } from "../api/authApi";

const AuthLayout = ({ isRegister = false, setCurrentUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoTen, setHoTen] = useState(""); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // ✅ Validate cơ bản
    const emailTrim = String(email || "").trim();
    const passTrim = String(password || "");
    const nameTrim = String(hoTen || "").trim();

    if (!emailTrim) {
      alert("Vui lòng nhập email.");
      return;
    }
    
    if (!passTrim || passTrim.length < 6) {
      alert("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    
    if (isRegister && !nameTrim) {
      alert("Vui lòng nhập họ và tên.");
      return;
    }

    // ✅ Xóa token cũ trước khi đăng nhập/đăng ký
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    try {
      setLoading(true);

      let data;
      
      // ✅ Gọi API đăng ký hoặc đăng nhập
      if (isRegister) {
        data = await registerApi({ 
          hoTen: nameTrim, 
          email: emailTrim, 
          password: passTrim, 
          vaiTro: "teacher" 
        });
        
        // ✅ Đăng ký thành công -> chuyển sang trang đăng nhập
        alert(data?.message || "Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
        return;
        
      } else {
        data = await loginApi({ 
          email: emailTrim, 
          password: passTrim 
        });
      }

      // ✅ Kiểm tra response từ API đăng nhập
      if (!data?.token || !data?.user) {
        throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
      }

      // ✅ Lưu token và user vào localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // ✅ Cập nhật state App.jsx
      if (typeof setCurrentUser === "function") {
        setCurrentUser(data.user);
      }

      // ✅ Chuyển về trang chủ
      navigate("/home", { replace: true });

    } catch (err) {
      // ✅ Xóa localStorage nếu có lỗi
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      // ✅ Xử lý lỗi email đã tồn tại (409)
      if (err?.status === 409) {
        alert(err.message || "Email đã tồn tại. Vui lòng đăng nhập.");
        navigate("/login");
        return;
      }

      // ✅ Xử lý lỗi đăng nhập sai (401)
      if (err?.status === 401) {
        alert(err.message || "Email hoặc mật khẩu không đúng.");
        return;
      }

      // ✅ Xử lý lỗi khác
      alert(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      
    } finally {
      setLoading(false);
    }
  };

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${API_BASE}/api/auth/microsoft`;
  };

  return (
    <div className={`auth-layout ${isDarkMode ? "dark-mode" : ""}`}>
      {/* HEADER */}
      <header className="auth-header">
        <div className="logo">
          <h2>OpenQuiz</h2>
        </div>

        <div className="flag">
          <img
            src={vnIcon}
            alt="Vietnam Flag"
            style={{ width: "30px", height: "20px", borderRadius: "4px" }}
          />
        </div>

        <div className="dark-mode-toggle" onClick={toggleDarkMode}>
          <span style={{ fontSize: 20 }}>{isDarkMode ? "🌙" : "☀️"}</span>
        </div>
      </header>

      {/* FORM */}
      <div className="auth-box">
        <h2>{isRegister ? "Đăng ký" : "Đăng nhập"}</h2>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Họ và tên"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              placeholder="Nhập số điện thoại, email hoặc username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={loading}
            />
          </div>

          {!isRegister && (
            <div className="forgot-password">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        {/* SOCIAL LOGIN */}
        <div className="social-login">
          <button
            className="social-btn google-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img src={googleIcon} alt="Google" />
            Google
          </button>

          <button
            className="social-btn microsoft-btn"
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={loading}
          >
            <img src={microsoftIcon} alt="Microsoft" />
            Microsoft
          </button>
        </div>

        {/* LINK CHUYỂN TRANG */}
        <div className="register-link">
          <p>
            {isRegister ? "Bạn đã có tài khoản? " : "Bạn chưa có tài khoản? "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Đăng nhập" : "Tạo tài khoản mới"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;