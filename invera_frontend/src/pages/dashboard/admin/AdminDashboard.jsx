import React, { useEffect, useState } from "react";
import {
  UsersIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../../hooks/useAuth";
import { useUserManagement } from "../../../hooks/useUserManagement";
import { useReports } from "../../../hooks/useReports";

const AdminDashboard = () => {
  const { getCurrentUser, logout } = useAuth();
  const admin = getCurrentUser();

  const { getUsers, addUser, updateUserRole, toggleUserStatus, deleteUser, updateUser } = useUserManagement();
  const [users, setUsers] = useState([]);
  const { getReports } = useReports();
  const [reports, setReports] = useState({ salesReports: [], purchaseReports: [] });

  const [activePage, setActivePage] = useState("users");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", role: "sales" });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "sales" });

  useEffect(() => {
    setUsers(getUsers());
    setReports(getReports());
  }, []);

  const refreshUsers = () => setUsers(getUsers());
  const refreshReports = () => setReports(getReports());

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-gray-700 flex flex-col shadow-lg border-r">
        {/* Sidebar title removed */}

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={UsersIcon}
            label="Gestion Utilisateurs"
            active={activePage === "users"}
            onClick={() => setActivePage("users")}
          />
          <SidebarItem
            icon={ChartBarIcon}
            label="Statistiques"
            active={activePage === "stats"}
            onClick={() => setActivePage("stats")}
          />
          <SidebarItem
            icon={ChartBarIcon}
            label="Rapports"
            active={activePage === "reports"}
            onClick={() => { setActivePage("reports"); refreshReports(); }}
          />
        </nav>

        <button
          onClick={logout}
          className="m-4 flex items-center gap-2 rounded-lg bg-red-50 text-red-600 px-4 py-2 text-sm hover:bg-red-100 transition"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" /> Déconnexion
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        

        {/* CONTENT */}
        <main className="p-6 overflow-y-auto">
          {/* USERS PAGE */}
          {activePage === "users" && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Utilisateurs</h2>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Ajouter un utilisateur
                </button>
              </div>

              {showAddForm && (
                <div className="p-4 mb-4 border rounded-lg bg-gray-50 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="border px-3 py-1 rounded-lg flex-1 focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="border px-3 py-1 rounded-lg flex-1 focus:ring-1 focus:ring-blue-400"
                  />
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="border px-3 py-1 rounded-lg"
                  >
                    <option value="sales">COMMERCIAL</option>
                    <option value="procurement">ACHATS</option>
                  </select>
                  <button
                    onClick={async () => {
                      try {
                        await addUser(newUserForm);
                        refreshUsers();
                        setNewUserForm({ name: "", email: "", role: "sales" });
                        setShowAddForm(false);
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {/* USERS TABLE */}
              <table className="w-full text-sm rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="p-3 text-left">Nom</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Rôle</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <React.Fragment key={user.id}>
                      <tr className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}>
                        <td className="p-3 font-medium">{user.name}</td>
                        <td className="p-3 text-gray-500">{user.email}</td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={async (e) => { await updateUserRole(user.id, e.target.value); refreshUsers(); }}
                            className="border rounded px-2 py-1 focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="sales">COMMERCIAL</option>
                            <option value="procurement">ACHATS</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {user.active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2">
                          <button onClick={async () => { await toggleUserStatus(user.id); refreshUsers(); }} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Toggle</button>
                          <button onClick={() => { setEditingUser(user.id); setEditForm({ name: user.name, email: user.email, role: user.role }); }} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">Editer</button>
                          <button onClick={async () => { await deleteUser(user.id); refreshUsers(); }} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition">Supprimer</button>
                        </td>
                      </tr>

                      {editingUser === user.id && (
                        <tr>
                          <td colSpan={5} className="p-3 bg-gray-50">
                            <div className="flex gap-2 items-center">
                              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border px-3 py-1 rounded-lg flex-1 focus:ring-1 focus:ring-blue-400" placeholder="Nom" />
                              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="border px-3 py-1 rounded-lg flex-1 focus:ring-1 focus:ring-blue-400" placeholder="Email" />
                              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="border px-3 py-1 rounded-lg">
                                <option value="sales">COMMERCIAL</option>
                                <option value="procurement">ACHATS</option>
                              </select>
                              <button onClick={async () => { await updateUser(user.id, editForm); setEditingUser(null); refreshUsers(); }} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Sauvegarder</button>
                              <button onClick={() => setEditingUser(null)} className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Annuler</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PROFESSIONAL STATISTICS PAGE */}
          {activePage === "stats" && (
            <div className="space-y-8">
              {/* USERS STATS */}
              <section className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-gray-700 mb-2">Utilisateurs</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Visualisation détaillée des utilisateurs actifs, inactifs et tendances.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Active/Inactive Bar */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Actifs vs Inactifs</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          { name: "Actifs", value: users.filter(u => u.active).length },
                          { name: "Inactifs", value: users.filter(u => !u.active).length },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-gray-500 text-xs mt-1">Nombre d'utilisateurs actifs et inactifs.</p>
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Répartition</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Actifs", value: users.filter(u => u.active).length },
                            { name: "Inactifs", value: users.filter(u => !u.active).length },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-gray-500 text-xs mt-1">Proportion d'utilisateurs.</p>
                  </div>

                  {/* Line Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Tendance Utilisateurs</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={users.map((u, index) => ({ day: `User ${index+1}`, total: index+1 }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" hide />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-gray-500 text-xs mt-1">Évolution du nombre total d'utilisateurs.</p>
                  </div>
                </div>
              </section>

              {/* SALES / PURCHASE STATS */}
              <section className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-gray-700 mb-2">Rapports des ventes et achats</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Graphiques détaillés des ventes et achats.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales Bar */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Ventes</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reports.salesReports.map(r => ({ name: r.date, total: r.total }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-gray-500 text-xs mt-1">Ventes totales par date.</p>
                  </div>

                  {/* Purchases Line */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Achats</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={reports.purchaseReports.map(r => ({ name: r.date, total: r.total }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-gray-500 text-xs mt-1">Achats totaux par date.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* REPORTS PAGE */}
          {activePage === "reports" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReportCard title="Rapports des ventes" reports={reports.salesReports} />
              <ReportCard title="Rapports des achats" reports={reports.purchaseReports} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/* SIDEBAR ITEM */
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition duration-300 ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
    <Icon className="h-5 w-5" /> {label}
  </button>
);

/* REPORT CARD */
const ReportCard = ({ title, reports }) => (
  <div className="p-6 rounded-xl shadow bg-white hover:shadow-md transition">
    <h3 className="font-semibold mb-2">{title}</h3>
    {reports.length === 0 ? <p className="text-gray-500">Aucun rapport</p> : (
      <ul className="list-disc pl-5">
        {reports.map(r => <li key={r.id}>{r.date} - {r.description} - Total: {r.total} €</li>)}
      </ul>
    )}
  </div>
);

export default AdminDashboard;
