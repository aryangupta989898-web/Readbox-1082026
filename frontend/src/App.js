import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { ActivityPage } from "./pages/ActivityPage";
import { DiaryPage } from "./pages/DiaryPage";
import { ReadingsGridPage } from "./pages/ReadingsGridPage";
import { ReadingDetailPage } from "./pages/ReadingDetailPage";
import { RevisionPage } from "./pages/RevisionPage";
import { RecapPage } from "./pages/RecapPage";
import { LikesPage } from "./pages/LikesPage";
import { AuthorPage } from "./pages/AuthorPage";
import { LogReadingDialog } from "./components/LogReadingDialog";
import { Toaster } from "./components/ui/sonner";
import { Navigate } from "react-router-dom";

const RecapRedirect = () => {
    const now = new Date();
    return <Navigate to={`/recap/${now.getFullYear()}/${now.getMonth() + 1}`} replace />;
};

function App() {
    const [logOpen, setLogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="App">
            <BrowserRouter>
                <NavBar onLog={() => setLogOpen(true)} />
                <main key={refreshKey}>
                    <Routes>
                        <Route path="/" element={<ActivityPage onLog={() => setLogOpen(true)} />} />
                        <Route path="/diary" element={<DiaryPage />} />
                        <Route path="/readings" element={<ReadingsGridPage />} />
                        <Route path="/readings/:id" element={<ReadingDetailPage />} />
                        <Route path="/revision" element={<RevisionPage />} />
                        <Route path="/recap" element={<RecapRedirect />} />
                        <Route path="/recap/:year/:month" element={<RecapPage />} />
                        <Route path="/likes" element={<LikesPage />} />
                        <Route path="/author/:name" element={<AuthorPage />} />
                    </Routes>
                </main>
                <LogReadingDialog
                    open={logOpen}
                    onOpenChange={setLogOpen}
                    onCreated={() => setRefreshKey((k) => k + 1)}
                />
                <Toaster theme="dark" richColors position="bottom-right" />
            </BrowserRouter>
        </div>
    );
}

export default App;
