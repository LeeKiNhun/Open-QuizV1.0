// ⏰ ĐẾM NGƯỢC (10 phút)
let timeLeft = 10 * 60;
const timeEl = document.getElementById("time");

const timer = setInterval(() => {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  timeEl.textContent = `${min}:${sec.toString().padStart(2, "0")}`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    submitQuiz();
  }
  timeLeft--;
}, 1000);

// ✅ ĐÁP ÁN ĐÚNG
const answers = {
  q1: "B",
  q2: "C"
};

function submitQuiz() {
  clearInterval(timer);

  let score = 0;
  const form = document.getElementById("quizForm");

  Object.keys(answers).forEach(q => {
    const checked = form.querySelector(`input[name="${q}"]:checked`);
    if (checked && checked.value === answers[q]) {
      score++;
    }
  });

  document.getElementById("result").textContent =
    `🎉 Bạn đúng ${score}/${Object.keys(answers).length} câu`;
}
