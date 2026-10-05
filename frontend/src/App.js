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
import { ListsPage } from "./pages/ListsPage";
import { ListDetailPage } from "./pages/ListDetailPage";
import { WishlistPage } from "./pages/WishlistPage";
import { SearchPage } from "./pages/SearchPage";
import { BookPage } from "./pages/BookPage";
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
    const [logPrefill, setLogPrefill] = useState(null);
    const openLog = (prefill = null) => { setLogPrefill(prefill); setLogOpen(true); };

    return (
        <div className="App">
            <BrowserRouter>
                <NavBar onLog={() => openLog()} />
                <main key={refreshKey}>
                    <Routes>
                        <Route path="/" element={<ActivityPage onLog={() => openLog()} />} />
                        <Route path="/diary" element={<DiaryPage />} />
                        <Route path="/readings" element={<ReadingsGridPage />} />
                        <Route path="/readings/:id" element={<ReadingDetailPage />} />
                        <Route path="/revision" element={<RevisionPage />} />
                        <Route path="/recap" element={<RecapRedirect />} />
                        <Route path="/recap/:year/:month" element={<RecapPage />} />
                        <Route path="/likes" element={<LikesPage />} />
                        <Route path="/author/:name" element={<AuthorPage />} />
                        <Route path="/lists" element={<ListsPage />} />
                        <Route path="/lists/:id" element={<ListDetailPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/book/:bookId" element={<BookPage onLog={openLog} />} />
                    </Routes>
                </main>
                <LogReadingDialog
                    open={logOpen}
                    onOpenChange={(o) => { setLogOpen(o); if (!o) setLogPrefill(null); }}
                    prefill={logPrefill}
                    onCreated={() => setRefreshKey((k) => k + 1)}
                />
                <Toaster theme="dark" richColors position="bottom-right" />
            </BrowserRouter>
        </div>
    );
}

export default App;
