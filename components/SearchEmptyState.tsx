"use client";

import { useI18n } from "@/components/I18nProvider";

export default function SearchEmptyState() {
  const { t } = useI18n();
  return <div className="state">{t("noSearchQuery")}</div>;
}
