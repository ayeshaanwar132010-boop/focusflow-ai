import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  CheckCircle2,
  Circle,
  LogOut,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);

      if (currentSession) {
        loadTasks(currentSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session) {
      await loadTasks(session.user.id);
    }

    setLoading(false);
  }

  async function signUp() {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created. Check your email if confirmation is required.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function loadTasks(userId) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setTasks(data || []);
  }

  async function addTask() {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: session.user.id,
      title: title.trim(),
      subject: subject.trim(),
      priority,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setSubject("");
    setPriority("medium");

    await loadTasks(session.user.id);
  }

  async function toggleTask(task) {
    const nextStatus =
      task.status === "completed" ? "pending" : "completed";

    const { error } = await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTasks(session.user.id);
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTasks(session.user.id);
  }

  if (loading) {
    return <div className="center">Loading FocusFlow...</div>;
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <BookOpen size={42} />

          <h1>FocusFlow AI</h1>
          <p>Organize your studies. Stay focused.</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button onClick={signIn}>Login</button>

          <button className="secondary" onClick={signUp}>
            Create Account
          </button>
        </section>
      </main>
    );
  }

  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  return (
    <main className="app">
      <header>
        <div>
          <h1>FocusFlow AI</h1>
          <p>Your personal study dashboard</p>
        </div>

        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <section className="stats">
        <div>
          <strong>{tasks.length}</strong>
          <span>Total Tasks</span>
        </div>

        <div>
          <strong>{completed}</strong>
          <span>Completed</span>
        </div>

        <div>
          <strong>{tasks.length - completed}</strong>
          <span>Remaining</span>
        </div>
      </section>

      <section className="add-card">
        <h2>Add Study Task</h2>

        <input
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          placeholder="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button onClick={addTask}>
          <Plus size={18} />
          Add Task
        </button>
      </section>

      <section className="tasks">
        <h2>Your Tasks</h2>

        {tasks.length === 0 ? (
          <div className="empty">
            <p>No tasks yet.</p>
            <span>Add your first study task above.</span>
          </div>
        ) : (
          tasks.map((task) => (
            <article className="task" key={task.id}>
              <button
                className="icon-button"
                onClick={() => toggleTask(task)}
              >
                {task.status === "completed" ? (
                  <CheckCircle2 />
                ) : (
                  <Circle />
                )}
              </button>

              <div className="task-content">
                <h3>{task.title}</h3>
                <p>
                  {task.subject || "General"} · {task.priority} priority
                </p>
              </div>

              <button
                className="icon-button danger"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 />
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;