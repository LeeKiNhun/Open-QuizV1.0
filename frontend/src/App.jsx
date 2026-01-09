// src/App.jsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RoleProvider } from "./context/RoleContext";

import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import HomeWorkLayout from "./layouts/HomeWorkLayout";
import CreateHomeWork from "./layouts/CreateHomeWork"; 
import ExamPage from "./pages/ExamPages/ExamPage";
import CreateExam from "./pages/ExamPages/CreateExam";
import OpenQuizRepoPage from "./pages/ExamPages/OpenQuizRepoPage";
import OpenQuizFolderPage from "./pages/ExamPages/OpenQuizFolderPage";
import ClassPage from "./pages/ClassPages/ClassPage";
import CreateClassModal from "./pages/ClassPages/CreateClassModal";
import ClassDetailPage from "./pages/ClassPages/ClassDetailPage";
import TeacherPage from "./pages/TeacherPages/TeacherPage";
import StudentLandingPage from "./pages/StudentLandingPage";
import StudentDoHomeworkPage from "./pages/StudentDoHomeworkPage";
import HomeworkPublishSuccessPage from "./layouts/HomeworkPublishSuccessPage";
import QuestionBankListPage from "./pages/user/QuestionBankListPage";
import QuestionBankCreatePage from "./pages/user/QuestionBankCreatePage";
import QuestionBankDetailPage from "./pages/user/QuestionBankDetailPage";
import QuestionBankImportPage from "./pages/user/QuestionBankImportPage";
import QuestionBankEditorPage from "./pages/user/QuestionBankEditorPage";
import QuestionBankStructureCreatePage from "./pages/user/QuestionBankStructureCreatePage";
import QuestionBankStructureManagePage from "./pages/user/QuestionBankStructureManagePage";
import StructureDocxPreviewPage from "./pages/user/StructureDocxPreviewPage";
import TakeQuizPage from "./pages/TakeQuizPage";
import TaiLieuPage from "./pages/TaiLieuPage";
import "./App.css";

function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16, color: "#111827" }}>
      <h2 style={{ margin: "8px 0 16px" }}>Chào mừng bạn đến với OpenQuiz 🎉</h2>
      <p>
        Bạn có thể tạo <b>Bài tập</b>, <b>Đề thi</b> hoặc <b>Bảng đáp án</b> để
        học sinh thi online hoặc offline bằng phiếu tô trắc nghiệm.
      </p>

      <div className="button-container">
        <button
          className="action-btn btn-create"
          onClick={() => navigate("/baitap/tao")}
          type="button"
        >
          <span className="button-icon">➕</span> Tạo bài tập hoặc đề thi
        </button>

        <button
          className="action-btn btn-bank"
          onClick={() => navigate("/nganhang")}
          type="button"
        >
          <span className="button-icon">🏛</span> Tạo đề từ ngân hàng chung
        </button>

        <button
          className="action-btn btn-download"
          onClick={() => navigate("/kho-de-openquiz")}
          type="button"
        >
          <span className="button-icon">⬇️</span> Tải đề từ kho đề OpenQuiz
        </button>
      </div>
    </div>
  );
}

// ✅ Component bảo vệ route - yêu cầu đăng nhập
function ProtectedRoute({ children, currentUser }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục user từ localStorage khi app khởi động
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("currentUser");
      
      if (token && savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Lỗi khôi phục user:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
  };

  // Hiển thị loading khi đang kiểm tra
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <Routes>
        {/* ===== TRANG MẶC ĐỊNH ===== */}
        <Route 
          path="/" 
          element={
            currentUser ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          } 
        />
        {/* ===== AUTH ROUTES ===== */}
        <Route 
          path="/login" 
          element={
            currentUser ? (
              <Navigate to="/home" replace />
            ) : (
              <AuthLayout isRegister={false} setCurrentUser={setCurrentUser} />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            currentUser ? (
              <Navigate to="/home" replace />
            ) : (
              <AuthLayout isRegister={true} setCurrentUser={setCurrentUser} />
            )
          } 
        />

        {/* ===== PUBLIC ROUTES - HỌC SINH ===== */}
        <Route path="/student" element={<StudentLandingPage />} />
        <Route path="/lam-bai/:shareCode" element={<StudentDoHomeworkPage />} />

        {/* ===== PROTECTED ROUTES - GIÁO VIÊN ===== */}
        
        {/* Home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Màn hình chính" onLogout={handleLogout}>
                <HomeScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Bài tập */}
        <Route
          path="/baitap"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Bài tập" onLogout={handleLogout}>
                <HomeWorkLayout />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/baitap/tao"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo bài tập mới" onLogout={handleLogout}>
                <CreateHomeWork />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Đề thi */}
        <Route
          path="/dethi"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Đề thi" onLogout={handleLogout}>
                <ExamPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dethi/tao"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo đề thi" onLogout={handleLogout}>
                <CreateExam />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Kho đề OpenQuiz */}
        <Route
          path="/kho-de-openquiz"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Kho đề OpenQuiz" onLogout={handleLogout}>
                <OpenQuizRepoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kho-de-openquiz/:folderId/*"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Kho đề OpenQuiz" onLogout={handleLogout}>
                <OpenQuizFolderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Quản lý lớp */}
        <Route
          path="/lop"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Quản lý lớp" onLogout={handleLogout}>
                <ClassPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lop/tao"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo lớp mới" onLogout={handleLogout}>
                <CreateClassModal />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lop/tao-khoa-moi"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo lớp cho khóa mới" onLogout={handleLogout}>
                <div style={{ padding: 16 }}>Trang Tạo lớp cho khóa mới</div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lop/:classId/*"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Chi tiết lớp" onLogout={handleLogout}>
                <ClassDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Quản lý giáo viên */}
        <Route
          path="/gv"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Quản lý giáo viên" onLogout={handleLogout}>
                <TeacherPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/baitap/xuatban"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Xuất bản bài tập" onLogout={handleLogout}>
                <HomeworkPublishSuccessPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Ngân hàng */}
          {/* Ngân hàng câu hỏi */}
        <Route
          path="/nganhang"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Ngân hàng câu hỏi" onLogout={handleLogout}>
                <QuestionBankListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/tao"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo ngân hàng câu hỏi" onLogout={handleLogout}>
                <QuestionBankCreatePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/:id"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Chi tiết ngân hàng" onLogout={handleLogout}>
                <QuestionBankDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/:id/nhap-cau-hoi"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Nhập câu hỏi" onLogout={handleLogout}>
                <QuestionBankImportPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Route chuyển hướng không cần bọc Layout vì nó sẽ nhảy sang route nhap-cau-hoi */}
        <Route path="/nganhang/:id/import" element={<Navigate to="../nhap-cau-hoi" replace />} />

        <Route
          path="/nganhang/:id/soan-de"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Soạn đề thi" onLogout={handleLogout}>
                <QuestionBankEditorPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/:id/tao-cau-truc"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Tạo cấu trúc đề" onLogout={handleLogout}>
                <QuestionBankStructureCreatePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/:id/cau-truc"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Quản lý cấu trúc" onLogout={handleLogout}>
                <QuestionBankStructureManagePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/nganhang/:id/structure/preview"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout currentUser={currentUser} title="Xem trước cấu trúc" onLogout={handleLogout}>
                <StructureDocxPreviewPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/take"
          element={
              <MainLayout currentUser={currentUser} title="Trang làm bài" onLogout={handleLogout}>
                <TakeQuizPage />
              </MainLayout>
          }
        />
        <Route
          path="/tailieu"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <MainLayout
                currentUser={currentUser}
                title="Tài liệu"
                onLogout={handleLogout}
              >
                <TaiLieuPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* ===== FALLBACK ===== */}
        <Route 
          path="*" 
          element={
            currentUser ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </RoleProvider>
  );
}