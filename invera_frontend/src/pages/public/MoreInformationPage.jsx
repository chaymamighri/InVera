import React, { useState } from "react";
import {
  BarChart3,
  FileText,
  Smartphone,
  Bot,
  ShoppingCart,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

const MoreInformationPage = () => {
  const { language } = useLanguage();

  const translations = {
    fr: {
      title: "Découvrez toutes les fonctionnalités",
      description:
        "Une plateforme ERP moderne conçue pour centraliser toutes les opérations de votre entreprise.",

      statistiques: {
        title: "Statistiques",
        heading: "Analysez votre activité en temps réel",
        description:
          "Suivez vos ventes, vos performances commerciales, vos achats et vos indicateurs clés grâce à des tableaux de bord modernes.",
        link: "Voir les statistiques",
      },

      documents: {
        title: "Documents",
        heading: "Centralisez tous vos documents ERP",
        description:
          "Gérez vos factures, devis, bons de commande et documents commerciaux depuis une seule plateforme.",
        link: "Voir les documents",
      },

      multiplatform: {
        title: "Web & Mobile",
        heading: "Une expérience multiplateforme",
        description:
          "Accédez à InVera depuis ordinateur, tablette ou mobile avec une expérience fluide et synchronisée.",
        link: "Découvrir la plateforme",
      },

      ai: {
        title: "Assistant AI",
        heading: "Un assistant intelligent intégré",
        description:
          "Interagissez avec un assistant AI capable de répondre aux questions et assister les utilisateurs.",
        link: "Découvrir AI",
      },

      approvisionnement: {
        title: "Approvisionnement",
        heading: "Optimisez vos achats et fournisseurs",
        description:
          "Pilotez vos commandes fournisseurs, vos stocks et vos approvisionnements avec une visibilité complète.",
        link: "Voir approvisionnement",
      },

      ventes: {
        title: "Ventes",
        heading: "Boostez votre performance commerciale",
        description:
          "Suivez vos ventes, vos clients et vos opérations commerciales avec des outils modernes.",
        link: "Voir les ventes",
      },
    },

    en: {
      title: "Discover all features",
      description:
        "A modern ERP platform designed to centralize all your business operations.",

      statistiques: {
        title: "Statistics",
        heading: "Analyze your business in real time",
        description:
          "Track sales, purchases, and KPIs with modern dashboards.",
        link: "View statistics",
      },

      documents: {
        title: "Documents",
        heading: "Centralize all your ERP documents",
        description:
          "Manage invoices, quotations, and commercial documents from one platform.",
        link: "View documents",
      },

      multiplatform: {
        title: "Web & Mobile",
        heading: "A multiplatform experience",
        description:
          "Access InVera from desktop, tablet, or mobile seamlessly.",
        link: "Discover platform",
      },

      ai: {
        title: "AI Assistant",
        heading: "An integrated intelligent assistant",
        description:
          "Interact with an AI assistant capable of answering questions and helping users.",
        link: "Discover AI",
      },

      approvisionnement: {
        title: "Procurement",
        heading: "Optimize purchasing and suppliers",
        description:
          "Manage supplier orders and procurement operations efficiently.",
        link: "View procurement",
      },

      ventes: {
        title: "Sales",
        heading: "Boost your sales performance",
        description:
          "Track sales and customers with modern tools.",
        link: "View sales",
      },
    },

    ar: {
      title: "اكتشف جميع الميزات",
      description:
        "منصة ERP حديثة مصممة لتجميع جميع عمليات مؤسستك.",

      statistiques: {
        title: "الإحصائيات",
        heading: "حلّل نشاطك في الوقت الحقيقي",
        description:
          "تابع المبيعات والمشتريات ومؤشرات الأداء عبر لوحات تحكم حديثة.",
        link: "عرض الإحصائيات",
      },

      documents: {
        title: "الوثائق",
        heading: "مركزة جميع وثائق ERP الخاصة بك",
        description:
          "قم بإدارة الفواتير ووثائقك التجارية من منصة واحدة.",
        link: "عرض الوثائق",
      },

      multiplatform: {
        title: "ويب و موبايل",
        heading: "تجربة متعددة المنصات",
        description:
          "استخدم InVera من الكمبيوتر أو الهاتف بسهولة.",
        link: "اكتشف المنصة",
      },

      ai: {
        title: "المساعد الذكي",
        heading: "مساعد ذكي مدمج",
        description:
          "تفاعل مع مساعد ذكي قادر على الإجابة عن الأسئلة.",
        link: "اكتشف الذكاء الاصطناعي",
      },

      approvisionnement: {
        title: "التزويد",
        heading: "قم بتحسين عمليات الشراء",
        description:
          "تحكم في الموردين والمخزون وعمليات التزويد.",
        link: "عرض التزويد",
      },

      ventes: {
        title: "المبيعات",
        heading: "طوّر أداءك التجاري",
        description:
          "تابع المبيعات والعملاء باستخدام أدوات حديثة.",
        link: "عرض المبيعات",
      },
    },
  };

  const t = translations[language] || translations.fr;

  const tabs = [
    {
      id: "documents",
      icon: <FileText size={18} />,
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: "statistiques",
      icon: <BarChart3 size={18} />,
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: "multiplatform",
      icon: <Smartphone size={18} />,
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: "ai",
      icon: <Bot size={18} />,
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: "approvisionnement",
      icon: <ShoppingCart size={18} />,
      image:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: "ventes",
      icon: <TrendingUp size={18} />,
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const [activeTab, setActiveTab] = useState("documents");

  const activeContent = tabs.find(
    (tab) => tab.id === activeTab
  );

  const current = t[activeTab];
  const currentIndex = tabs.findIndex(
    (tab) => tab.id === activeTab
  );
  const nextTab =
    tabs[(currentIndex + 1) % tabs.length];
  const nextContent = t[nextTab.id];

  return (
    <section className="w-full bg-[#f8fbff] py-24">

      <div className="max-w-[1550px] mx-auto px-5 lg:px-8">

        {/* TITLE */}

        <div className="text-center mb-14">

          <h2 className="text-4xl font-bold text-slate-900 md:text-[42px]">
            {t.title}
          </h2>

          <p className="mt-4 text-base text-slate-600 max-w-3xl mx-auto md:text-lg">
            {t.description}
          </p>

        </div>

        {/* BUTTONS */}

        <div className="flex flex-wrap justify-center gap-4 mb-12">

          {tabs.map((tab) => {

            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 rounded-2xl border px-5 py-3.5
                  text-[14px] font-semibold transition-all duration-300
                  ${
                    isActive
                      ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-lg"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }
                `}
              >
                {tab.icon}

                {t[tab.id].title}
              </button>
            );
          })}

        </div>

        {/* STANDARD CARD */}

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">

          <div className="grid lg:grid-cols-2 min-h-[460px]">

            {/* LEFT */}

            <div className="flex items-center">

              <div className="px-10 py-10 lg:px-12">

                <div className="mb-6">

                  <h3 className="max-w-[560px] text-[34px] leading-[1.12] font-bold text-[#071437] lg:text-[40px]">
                    {current.heading}
                  </h3>

                </div>

                <p className="max-w-[620px] text-[18px] leading-[34px] text-slate-500">
                  {current.description}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab(nextTab.id)}
                  className="mt-9 flex items-center gap-2 text-[17px] font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-all"
                >
                  {nextContent.link}

                  <ChevronRight size={22} />
                </button>

              </div>

            </div>

            {/* RIGHT */}

            <div className="relative bg-[#f4f8ff] min-h-[460px]">

              <img
                src={activeContent.image}
                alt={current.title}
                className="absolute inset-0 h-full w-full object-cover"
              />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default MoreInformationPage;
