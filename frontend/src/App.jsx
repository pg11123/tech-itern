
import MainMenu from "./components/MainMenu";
import Form from "./components/Form";
import { Routes, Route } from "react-router";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/login" element={<Form />} />
      <Route path="/register" element={<Form />} />
      <Route path="*" element={<div>Nie znaleziono strony</div>} />
    </Routes>
  );
}

