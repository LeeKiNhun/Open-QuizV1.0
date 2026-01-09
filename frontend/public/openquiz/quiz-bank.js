// ================== NGÂN HÀNG ĐỀ ==================
const exams = [
  {
    id: 1,
    name: "Đề thi thử THPT Quốc Gia – Địa Lí (45 phút)",
    time: 45 * 60, // 45 phút = 2700 giây
    questions: [
      {
        q: "Địa hình Việt Nam chủ yếu là",
        options: ["Núi cao", "Đồi núi thấp", "Đồng bằng", "Sa mạc"],
        answer: 1
      },
      {
        q: "Khí hậu Việt Nam mang tính chất chủ yếu là",
        options: ["Ôn đới", "Hàn đới", "Nhiệt đới ẩm gió mùa", "Cận nhiệt"],
        answer: 2
      },
      {
        q: "Atlat Địa lí Việt Nam được sử dụng tốt nhất cho dạng câu hỏi nào?",
        options: ["Lý thuyết", "Tính toán", "Thực hành", "Ghi nhớ"],
        answer: 2
      },
      {
        q: "Vùng kinh tế trọng điểm phía Bắc không bao gồm tỉnh nào sau đây?",
        options: ["Hà Nội", "Hải Phòng", "Quảng Ninh", "Thanh Hóa"],
        answer: 3
      },
      {
        q: "Gió mùa Đông Bắc hoạt động mạnh nhất vào mùa",
        options: ["Hạ", "Thu", "Đông", "Xuân"],
        answer: 2
      },

      // ===== AUTO SINH CÂU 6 → 50 =====
      ...Array.from({ length: 45 }).map((_, i) => ({
        q: `Câu ${i + 6}. Nội dung kiến thức Địa lí tổng hợp số ${i + 6} là`,
        options: [
          "Phát triển công nghiệp",
          "Chuyển dịch cơ cấu kinh tế",
          "Khai thác lãnh thổ",
          "Bảo vệ môi trường"
        ],
        answer: i % 4
      }))
    ]
  }
];

// ================== STATE ==================
let currentExam = null;
let timeLeft = 0;
let timerInterval = null;

// ================== RENDER NGÂN HÀNG ==================
const bankDiv = document.getElementById("bank");
exams.forEach((exam) => {
  const btn = document.createElement("button");
  btn.textContent = exam.name;
  btn.onclick = () => loadExam(exam);
  bankDiv.appendChild(btn);
});

// ================== LOAD ĐỀ ==================
function loadExam(exam) {
  currentExam = exam;
  timeLeft = exam.time;
  document.getElementById("result").textContent = "";
  renderQuiz();
  startTimer();
}

// ================== RENDER CÂU HỎI ==================
function renderQuiz() {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";

  currentExam.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `<b>Câu ${i + 1}.</b> ${q.q}`;

    q.options.forEach((opt, idx) => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="radio" name="q${i}" value="${idx}" />
        ${opt}
      `;
      div.appendChild(label);
    });

    quizDiv.appendChild(div);
  });
}

// ================== TIMER ==================
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    document.getElementById("timer").textContent =
      `⏰ ${min}:${sec.toString().padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
    timeLeft--;
  }, 1000);
}

// ================== CHẤM ĐIỂM ==================
function submitQuiz() {
  if (!currentExam) return;

  clearInterval(timerInterval);
  let score = 0;

  currentExam.questions.forEach((q, i) => {
    const checked = document.querySelector(
      `input[name="q${i}"]:checked`
    );
    if (checked && parseInt(checked.value) === q.answer) {
      score++;
    }
  });

  document.getElementById("result").textContent =
    `🎉 Kết quả: ${score}/${currentExam.questions.length} câu đúng`;
}
