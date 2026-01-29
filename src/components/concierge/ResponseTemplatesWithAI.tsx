import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Copy, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { selectFrom, eq } from "@/lib/dataApi";

interface ResponseTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

export function ResponseTemplatesWithAI() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inquiry, setInquiry] = useState("");
  const [suggestedTemplate, setSuggestedTemplate] = useState<ResponseTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<ResponseTemplate>("response_templates", {
      filters: [eq("is_active", true)],
      order: { column: "category", ascending: true },
    });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map((t) => t.category))];
    return cats.sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ResponseTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) {
        groups[t.category] = [];
      }
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const handleCopy = async (template: ResponseTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const findBestTemplate = () => {
    if (!inquiry.trim()) {
      toast.error("Please enter a member inquiry");
      return;
    }

    const inquiryWords = inquiry.toLowerCase().split(/\s+/);
    let bestMatch: ResponseTemplate | null = null;
    let bestScore = 0;

    templates.forEach((template) => {
      let score = 0;
      const searchableText = `${template.title} ${template.content} ${template.tags.join(" ")}`.toLowerCase();

      inquiryWords.forEach((word) => {
        if (word.length > 2 && searchableText.includes(word)) {
          score += 1;
        }
      });

      // Bonus for tag matches
      template.tags.forEach((tag) => {
        if (inquiry.toLowerCase().includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    });

    if (bestMatch && bestScore > 0) {
      setSuggestedTemplate(bestMatch);
      toast.success("Found a matching template!");
    } else {
      setSuggestedTemplate(null);
      toast.info("No matching template found. Try different keywords.");
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-wider font-normal">
          Response Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="browse" className="rounded-none text-xs">
              Browse Templates
            </TabsTrigger>
            <TabsTrigger value="ai" className="rounded-none text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Suggester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 rounded-none text-xs"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] rounded-none text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {Object.keys(groupedTemplates).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No templates found
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <AccordionItem key={category} value={category} className="border-b">
                    <AccordionTrigger className="text-xs uppercase tracking-wider hover:no-underline py-3">
                      {category}
                      <Badge variant="secondary" className="ml-2 rounded-none text-xs">
                        {categoryTemplates.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {categoryTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-xs font-medium">{template.title}</h4>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {template.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[10px] rounded-none"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(template)}
                                className="h-8 rounded-none"
                              >
                                {copiedId === template.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                              {template.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-4">
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">
                Paste the member's inquiry below
              </label>
              <Textarea
                placeholder="e.g., Hi, I'm interested in learning about your membership options and pricing..."
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                className="min-h-[120px] rounded-none text-xs"
              />
              <Button
                onClick={findBestTemplate}
                className="w-full rounded-none"
                disabled={!inquiry.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Find Best Template
              </Button>
            </div>

            {suggestedTemplate && (
              <div className="border p-4 bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className="rounded-none text-xs mb-2">Suggested</Badge>
                    <h4 className="text-xs font-medium">{suggestedTemplate.title}</h4>
                    <p className="text-xs text-muted-foreground">{suggestedTemplate.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(suggestedTemplate)}
                    className="h-8 rounded-none"
                  >
                    {copiedId === suggestedTemplate.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs mt-3 whitespace-pre-wrap border-t pt-3">
                  {suggestedTemplate.content}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
