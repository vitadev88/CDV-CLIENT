"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { Listing } from "@/types";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Building2, Car, Tag, ChevronRight } from "lucide-react";
import React from "react";

interface Category {
  id: string;
  code: string;
  name: string;
  detailType: string | null;
  active: boolean;
  sortOrder: number;
  children: Category[];
}

const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1`,
});

function iconForDetailType(detailType: string | null): React.ElementType {
  if (detailType === "CAR") return Car;
  if (detailType === "REAL_ESTATE") return Building2;
  return Tag;
}

function getLeafCategories(categories: Category[]): { code: string; label: string; icon: React.ElementType }[] {
  const leaves: { code: string; label: string; icon: React.ElementType }[] = [];
  for (const cat of categories) {
    if (cat.children.length > 0) {
      for (const child of cat.children) {
        if (child.active) {
          leaves.push({ code: child.code, label: child.name, icon: iconForDetailType(child.detailType) });
        }
      }
    } else if (cat.active) {
      leaves.push({ code: cat.code, label: cat.name, icon: iconForDetailType(cat.detailType) });
    }
  }
  return leaves;
}

const BADGES = ["Nổi bật", "Hot", "VIP", "Mới"];

export default function HomePage() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [sections, setSections] = useState<Record<string, { listings: Listing[]; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [categorySections, setCategorySections] = useState<{ code: string; label: string; icon: React.ElementType }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const catRes = await publicApi.get<{ data: Category[] }>("/categories");
      const leaves = getLeafCategories(catRes.data.data ?? []);
      setCategorySections(leaves);

      const [featuredRes, ...catResults] = await Promise.all([
        api.get("/listings?size=5&page=0"),
        ...leaves.map((s) =>
          api.get(`/listings?categoryCode=${s.code}&size=4&page=0`)
        ),
      ]);
      setFeatured(featuredRes.data.data?.content ?? []);
      const map: Record<string, { listings: Listing[]; total: number }> = {};
      leaves.forEach((s, i) => {
        map[s.code] = {
          listings: catResults[i]?.data?.data?.content ?? [],
          total: catResults[i]?.data?.data?.totalElements ?? 0,
        };
      });
      setSections(map);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="p-6">
      {/* Featured Listings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-foreground">Tin đăng nổi bật</h2>
            <p className="text-sm text-muted-foreground">Các tin đăng được quan tâm nhiều nhất</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/tim-kiem">Xem tất cả</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {featured.map((l, i) => (
              <ListingCard key={l.id} listing={l} badge={BADGES[i % BADGES.length]} />
            ))}
          </div>
        )}
      </div>

      {/* Category Sections */}
      <div className="space-y-8">
        {categorySections.map(({ code, label, icon: Icon }) => {
          const sec = sections[code];
          if (!loading && (!sec || sec.listings.length === 0)) return null;
          return (
            <div key={code} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{label}</h2>
                    <p className="text-sm text-muted-foreground">
                      {loading ? "..." : `${sec?.total ?? 0}+ tin đăng`}
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="gap-1">
                  <Link href={`/tim-kiem?category=${code}`}>
                    Xem tất cả
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sec?.listings.map((l, i) => (
                    <ListingCard key={l.id} listing={l} badge={i === 0 ? "Nổi bật" : undefined} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-5 bg-muted rounded w-1/2 mt-1" />
      </div>
    </div>
  );
}
