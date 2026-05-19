import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, User } from 'lucide-react';

interface Admin {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  grade: string;
}

interface Researcher {
  id: number;
  nom: string;
  prenom: string;
  grade: string;
  email: string;
  role: string;
}

export default function GestionAdmin() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [selectedResearcher, setSelectedResearcher] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    fetchCurrentAdmin();
    fetchResearchers();
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch('/api/admin/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.id) {
        setCurrentAdmin(data);
      }
    } catch (error) {
      console.error('Error fetching current admin:', error);
    }
  };

  const fetchResearchers = async () => {
    try {
      const response = await fetch('/api/admin/researchers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setResearchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching researchers:', error);
    }
  };

  const handleChangeAdmin = async () => {
    if (!selectedResearcher) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un chercheur' });
      return;
    }

    const researcher = researchers.find(r => r.id.toString() === selectedResearcher);
    if (!researcher) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nom: researcher.nom,
          prenom: researcher.prenom,
          email: researcher.email
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewPassword(data.password);
        setMessage({
          type: 'success',
          text: `Admin changé avec succès! Nouveau mot de passe: ${data.password}`
        });
        fetchCurrentAdmin();
        setSelectedResearcher('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du changement d\'admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Current Admin Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Admin Actuel
            </CardTitle>
            <CardDescription>Directeur/Directrice actuel(le) du laboratoire</CardDescription>
          </CardHeader>
          <CardContent>
            {currentAdmin ? (
              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-gray-600">Nom</Label>
                  <p className="font-semibold">{currentAdmin.nom} {currentAdmin.prenom}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-semibold">{currentAdmin.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Grade</Label>
                  <p className="font-semibold">{currentAdmin.grade}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aucun admin trouvé</p>
            )}
          </CardContent>
        </Card>

        {/* Change Admin Card */}
        <Card>
          <CardHeader>
            <CardTitle>Changer l'Admin</CardTitle>
            <CardDescription>
              Sélectionnez un nouveau directeur/directrice. Le mot de passe sera généré automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="researcher-select">Sélectionner un chercheur</Label>
              <select
                id="researcher-select"
                value={selectedResearcher}
                onChange={(e) => setSelectedResearcher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choisir un chercheur --</option>
                {researchers.map((researcher) => (
                  <option key={researcher.id} value={researcher.id}>
                    {researcher.nom} {researcher.prenom} ({researcher.grade})
                    {researcher.role === 'admin' ? ' [ADMIN]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {newPassword && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Nouveau mot de passe:</strong> {newPassword}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Format: larodec + nom + prenom (minuscules, sans espaces)
                </p>
              </div>
            )}

            <Button
              onClick={handleChangeAdmin}
              disabled={loading || !selectedResearcher}
              className="w-full"
            >
              {loading ? 'Changement en cours...' : 'Changer l\'Admin'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Format du Mot de Passe</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              Le mot de passe est généré automatiquement selon le format:
            </p>
            <p className="font-mono bg-gray-100 p-2 rounded">
              larodec + nom + prenom
            </p>
            <p className="text-xs">
              Exemple: Pour Latifa Ben Arfa Rabai → <strong>larodecbenarfaLatifa</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
