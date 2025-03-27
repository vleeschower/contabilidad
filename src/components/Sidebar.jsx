import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaBook, FaBookReader, FaChair, FaChalkboard, FaExchangeAlt, FaFileArchive, FaHome, FaJournalWhills, FaRegFileExcel } from "react-icons/fa";
import { FaBookBookmark, FaBookJournalWhills, FaBookmark, FaBookOpen, FaBookOpenReader, FaBookQuran, FaBookSkull, FaBookTanakh, FaChartArea, FaChartBar, FaRegChartBar, FaScaleBalanced, FaScaleUnbalanced, FaScaleUnbalancedFlip } from "react-icons/fa6";
import { BsClipboard2Check, BsClipboard2Data, BsClipboard2DataFill, BsClipboard2Pulse, BsClipboard2PulseFill, BsFillJournalBookmarkFill } from "react-icons/bs";

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div 
            className={`bg-dark text-white d-flex flex-column p-3 shadow`}
            style={{ 
                width: isCollapsed ? "60px" : "250px", 
                minHeight: "100vh", 
                transition: "width 0.3s ease-in-out" 
            }}
        >
            {/* Botón de colapsar */}
            <div className="d-flex justify-content-end">
                <button className="btn btn-outline-light btn-sm" onClick={toggleSidebar}>
                    <FaBars />
                </button>
            </div>

            {/* Menú */}
            <ul className="nav flex-column mt-3">
                <li className="nav-item">
                    <Link to="/" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaHome />
                        {!isCollapsed && "Inicio"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/asiento-apertura" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaBook />
                        {!isCollapsed && "Asiento de Apertura"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/movimientos" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaExchangeAlt />
                        {!isCollapsed && "Movimientos"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/balance" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaScaleBalanced />
                        {!isCollapsed && "Balance General"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/libro-diario" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaBookOpen />
                        {!isCollapsed && "Libro Diario"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/libro-mayor" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <BsFillJournalBookmarkFill />
                        {!isCollapsed && "Libro Mayor"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/balance-comprobacion" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <FaScaleUnbalancedFlip />
                        {!isCollapsed && "Balance de comprobación"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/estado-resultados" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <BsClipboard2Check/>
                        {!isCollapsed && "Estado de Resultados"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/estado-cambios" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <BsClipboard2PulseFill/>
                        {!isCollapsed && "Estado de Cambios en Capital Contable"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/estado-flujos-efectivo" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <BsClipboard2DataFill/>
                        {!isCollapsed && "Estado de Flujos de Efectivo (Indirecto)"}
                    </Link>
                </li>
                <li className="nav-item mt-2">
                    <Link to="/estado-flujos-efectivo-d" className="nav-link text-white d-flex align-items-center gap-2"
                        style={{ padding: "10px", borderRadius: "5px", transition: "background 0.3s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#495057"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <BsClipboard2DataFill/>
                        {!isCollapsed && "Estado de Flujos de Efectivo (Directo)"}
                    </Link>
                </li>
                
            </ul>
        </div>
    );
};

export default Sidebar;
