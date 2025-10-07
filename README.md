# Overview

The app presents multiple-choice questions (with one correct answer) to the user, tracks their score, and gives immediate feedback after each selection. It’s designed to feel simple and responsive, allowing users to test their knowledge in a fun and minimal interface.

## How to use
- Open the app in your browser.  
- Click **Start Quiz** to begin.  
- Read each question carefully and select your answer.  
- After selecting, you’ll instantly see if your answer is correct.  
- Continue through all questions and view your final score at the end.  
- Click **Restart** to play again.

## Data source
- The quiz questions are stored in a local `questions.js` file (or JSON format), containing:  
  - `question`: the text of the question  
  - `options`: an array of four answer choices  
  - `correctAnswer`: the index or text of the correct option  
- The dataset was manually curated to ensure variety and clarity across topics.

## Purpose
- This project was designed to strengthen my understanding of networking and concurrency using real-time systems.
It helped me practice: 
  - Building a Node.js WebSocket server with Socket.IO
  - Handling bidirectional client-server communication 
  - Managing multiple rooms, players, and concurrent messages  
  - Designing event-driven architecture
- The main goal was to apply real-world networking concepts while keeping the gameplay intuitive and visually clean..

---

# Development Environment

- **Local server:**  
  - `npm run dev` **or**  
  - VS Code *Live Server* 
- **Languages/Libraries:**  
  - Vanilla **JavaScript**, **HTML**, and **CSS**

---

# Useful Websites

- [MDN Web Docs – DOM Manipulation](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)  
- [JavaScript Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)  
- [W3Schools – HTML Form Elements](https://www.w3schools.com/html/html_forms.asp)

---

# Future Work

- **Timer-based questions** for more challenge.  
- **Categories and difficulty levels** to increase replayability.  
- **Sound effects** for correct/wrong answers.  
- **Progress bar** to show quiz completion.  
- **Score sharing** via social media.  
 