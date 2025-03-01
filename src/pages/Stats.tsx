
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, PieChart, Calendar } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Mock data for demonstration - in a real app, this would come from your database
const lastWeekReviews = [
  { day: 'Mon', cards: 15 },
  { day: 'Tue', cards: 20 },
  { day: 'Wed', cards: 25 },
  { day: 'Thu', cards: 18 },
  { day: 'Fri', cards: 30 },
  { day: 'Sat', cards: 12 },
  { day: 'Sun', cards: 5 },
];

const performanceData = [
  { name: 'Again', value: 25, color: '#ef4444' },
  { name: 'Hard', value: 35, color: '#f97316' },
  { name: 'Good', value: 120, color: '#22c55e' },
  { name: 'Easy', value: 40, color: '#3b82f6' },
];

const deckDistribution = [
  { name: 'English', cards: 150, dueCards: 25, color: '#8b5cf6' },
  { name: 'Vocabulary', cards: 80, dueCards: 12, color: '#ec4899' },
  { name: 'Grammar', cards: 60, dueCards: 8, color: '#14b8a6' },
  { name: 'Phrases', cards: 40, dueCards: 5, color: '#f59e0b' },
];

const Stats = () => {
  const navigate = useNavigate();

  return (
    <div className="container px-4 py-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Statistics</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <PieChart size={16} />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="decks" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Decks</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reviews This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={lastWeekReviews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cards" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">330</div>
                <p className="text-xs text-muted-foreground">+24 from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cards Due Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50</div>
                <p className="text-xs text-muted-foreground">30 already reviewed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7 days</div>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Answer Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Average Retention Rate</h3>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">Based on review history</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Learning Speed</h3>
                  <div className="text-2xl font-bold">15 cards/day</div>
                  <p className="text-xs text-muted-foreground">Average new cards learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deck Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={deckDistribution}
                    layout="vertical"
                    barCategoryGap={16}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cards" name="Total Cards" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="dueCards" name="Due Cards" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deckDistribution.map((deck, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{deck.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-bold">{deck.cards} cards</div>
                      <p className="text-xs text-muted-foreground">{deck.dueCards} due today</p>
                    </div>
                    <div 
                      className="w-3 h-10 rounded-full" 
                      style={{ backgroundColor: deck.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NavBar />
    </div>
  );
};

export default Stats;
