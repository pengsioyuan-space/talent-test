import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home.tsx";
import { Gate } from "./pages/Gate.tsx";
import { Question } from "./pages/Question.tsx";
import { Loading } from "./pages/Loading.tsx";
import { Report } from "./pages/Report.tsx";
import { NotFound } from "./pages/NotFound.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Gate />} />
        <Route path="/q/:i" element={<Question />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/report/:rid" element={<Report />} />
        <Route path="/start" element={<Navigate to="/test" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}