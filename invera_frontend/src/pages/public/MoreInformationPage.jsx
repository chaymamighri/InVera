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

import aiImage from "../../assets/images/welcome/ai.png";
import approvisionnementImage from "../../assets/images/welcome/aprovisionnement.png";
import factureImage from "../../assets/images/welcome/facture.png";
import mobileImage from "../../assets/images/welcome/mobile.png";
import statistiquesImage from "../../assets/images/welcome/statestiques.png";
import ventesImage from "../../assets/images/welcome/ventes.png";
import { useLanguage } from "../../context/LanguageContext";

const MoreInformationPage = () => {
  const { language } = useLanguage();

  const translations = {
    fr: {
      title: "Decouvrez toutes les fonctionnalites",
      description:
        "Une plateforme ERP moderne concue pour centraliser les operations essentielles de votre entreprise.",

      statistiques: {
        title: "Statistiques",
        heading: "Analysez votre activite en temps reel",
        description:
          "Accedez a des tableaux de bord structures pour suivre les ventes, les achats, la marge et les indicateurs de performance avec une lecture immediate.",
        link: "Voir les statistiques",
      },

      documents: {
        title: "Documents",
        heading: "Structurez votre facturation et vos documents commerciaux",
        description:
          "Pilotez la facturation, les devis et les documents commerciaux depuis un environnement unique, avec un suivi clair, une organisation rigoureuse et une execution fluide.",
        link: "Voir les documents",
      },

      multiplatform: {
        title: "Web & Mobile",
        heading: "Une experience multiplateforme",
        description:
          "Travaillez sur ordinateur, tablette ou mobile avec une interface coherente, des donnees synchronisees et un acces continu aux operations essentielles.",
        link: "Decouvrir la plateforme",
      },

      ai: {
        title: "Assistant AI",
        heading: "Un assistant intelligent integre",
        description:
          "Appuyez-vous sur un assistant integre pour retrouver rapidement l'information utile, orienter les utilisateurs et fluidifier les taches quotidiennes.",
        link: "Decouvrir AI",
      },

      approvisionnement: {
        title: "Approvisionnement",
        heading: "Optimisez vos achats et fournisseurs",
        description:
          "Structurez les demandes d'achat, les commandes fournisseurs et le suivi des stocks avec une visibilite complete sur les engagements.",
        link: "Voir approvisionnement",
      },

      ventes: {
        title: "Ventes",
        heading: "Boostez votre performance commerciale",
        description:
          "Supervisez le cycle commercial, du prospect au document final, avec un suivi clair des clients, des opportunites et des resultats.",
        link: "Voir les ventes",
      },
    },

    en: {
      title: "Discover all features",
      description:
        "A modern ERP platform designed to centralize the essential operations of your business.",

      statistiques: {
        title: "Statistics",
        heading: "Analyze your business in real time",
        description:
          "Use structured dashboards to monitor sales, purchasing, margins, and core performance indicators with immediate clarity.",
        link: "View statistics",
      },

      documents: {
        title: "Documents",
        heading: "Structure invoicing and commercial documents in one flow",
        description:
          "Manage invoicing, quotations, and commercial documents from one controlled environment with clear follow-up, stronger organization, and smoother execution.",
        link: "View documents",
      },

      multiplatform: {
        title: "Web & Mobile",
        heading: "A multiplatform experience",
        description:
          "Work from desktop, tablet, or mobile with a consistent interface, synchronized data, and continuous access to key operations.",
        link: "Discover platform",
      },

      ai: {
        title: "AI Assistant",
        heading: "An integrated intelligent assistant",
        description:
          "Rely on an integrated assistant to surface useful information faster, guide users, and streamline recurring daily tasks.",
        link: "Discover AI",
      },

      approvisionnement: {
        title: "Procurement",
        heading: "Optimize purchasing and suppliers",
        description:
          "Structure purchase requests, supplier orders, and stock follow-up with full visibility into procurement commitments.",
        link: "View procurement",
      },

      ventes: {
        title: "Sales",
        heading: "Boost your sales performance",
        description:
          "Oversee the commercial cycle from lead to final document with clear tracking of customers, opportunities, and outcomes.",
        link: "View sales",
      },
    },

    ar: {
      title: "اكتشف جميع الميزات",
      description:
        "منصة ERP حديثة مصممة لتجميع العمليات الاساسية لمؤسستك داخل بيئة عمل واحدة.",

      statistiques: {
        title: "الاحصائيات",
        heading: "حلل نشاطك في الوقت الحقيقي",
        description:
          "اطلع على لوحات قيادة منظمة لمتابعة المبيعات والمشتريات والهامش ومؤشرات الاداء بوضوح وسرعة.",
        link: "عرض الاحصائيات",
      },

      documents: {
        title: "الوثائق",
        heading: "نظم الفوترة والوثائق التجارية داخل مسار واحد",
        description:
          "ادر الفوترة وعروض الاسعار والوثائق التجارية من داخل بيئة موحدة توفر متابعة واضحة وتنظيما ادق وتنفيذا اكثر سلاسة.",
        link: "عرض الوثائق",
      },

      multiplatform: {
        title: "ويب وموبايل",
        heading: "تجربة متعددة المنصات",
        description:
          "اعمل من الكمبيوتر او الجهاز اللوحي او الهاتف بواجهة موحدة وبيانات متزامنة ووصول مستمر للعمليات الاساسية.",
        link: "اكتشف المنصة",
      },

      ai: {
        title: "المساعد الذكي",
        heading: "مساعد ذكي مدمج",
        description:
          "استفد من مساعد مدمج للوصول السريع الى المعلومات وتوجيه المستخدمين وتسريع المهام اليومية المتكررة.",
        link: "اكتشف الذكاء الاصطناعي",
      },

      approvisionnement: {
        title: "التزويد",
        heading: "حسن عمليات الشراء",
        description:
          "نظم طلبات الشراء واوامر الموردين ومتابعة المخزون مع رؤية كاملة للالتزامات واحتياجات التزويد.",
        link: "عرض التزويد",
      },

      ventes: {
        title: "المبيعات",
        heading: "طور اداءك التجاري",
        description:
          "ادر الدورة التجارية من الفرصة الى الوثيقة النهائية مع متابعة واضحة للعملاء والنتائج التجارية.",
        link: "عرض المبيعات",
      },
    },
  };

  const t = translations[language] || translations.fr;

  const tabs = [
    {
      id: "documents",
      icon: <FileText size={18} />,
      image: factureImage,
    },
    {
      id: "statistiques",
      icon: <BarChart3 size={18} />,
      image: statistiquesImage,
    },
    {
      id: "multiplatform",
      icon: <Smartphone size={18} />,
      image: mobileImage,
    },
    {
      id: "ai",
      icon: <Bot size={18} />,
      image: aiImage,
    },
    {
      id: "approvisionnement",
      icon: <ShoppingCart size={18} />,
      image: approvisionnementImage,
    },
    {
      id: "ventes",
      icon: <TrendingUp size={18} />,
      image: ventesImage,
    },
  ];

  const [activeTab, setActiveTab] = useState("documents");

  const activeContent = tabs.find((tab) => tab.id === activeTab);
  const current = t[activeTab];
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const nextTab = tabs[(currentIndex + 1) % tabs.length];
  const nextContent = t[nextTab.id];

  return (
    <section className="w-full bg-[#f8fbff] py-24">
      <div className="max-w-[1550px] mx-auto px-5 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-slate-900 md:text-[42px]">
            {t.title}
          </h2>

          <p className="mt-4 text-base text-slate-600 max-w-3xl mx-auto md:text-lg">
            {t.description}
          </p>
        </div>

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

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-2 min-h-[460px]">
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
