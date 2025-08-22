import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function SearchQuick() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`${createPageUrl("BuscarNotas")}?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">Busca Rápida</h3>
            <p className="text-blue-100">Encontre rapidamente o que você precisa</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-4 h-4" />
              <Input
                placeholder="Digite aqui para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-blue-200 focus:bg-white/30"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}