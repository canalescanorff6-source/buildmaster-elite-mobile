import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  ATTRIBUTE_INPUTS,
  POSITION_LABELS,
  PLAYSTYLE_OPTIONS,
  analyzeCard,
  type AnalysisResult,
  type AttributeKey,
  type Attributes,
  type Objective,
  type PositionCode,
  type TacticalFormation,
  type TacticalStyle,
  type TrainingKey
} from './src/core/analyzer';
import { TRAINING_LABELS } from './src/core/trainingEngine';
import { FORMATIONS, OBJECTIVE_LABELS, TACTICAL_STYLES, buildManualText, defaultAttributesFor, type ManualInput } from './src/utils/manual';

type Tab = 'build' | 'result' | 'vault' | 'tactics';

type SavedBuild = {
  id: string;
  createdAt: string;
  playerName: string;
  position: string;
  playstyle?: string | null;
  result: AnalysisResult;
  completedSkills: string[];
  imageUri?: string | null;
};

const VAULT_KEY = 'buildmaster_elite_mobile_v1_vault';

const LINE_POSITIONS: PositionCode[] = ['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB'];
const GK_POSITION: PositionCode = 'GK';
const SKILL_OPTIONS = [
  'Toque duplo', 'Chute de primeira', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
  'Precisão à distância', 'Finalização acrobática', 'Cabeçada', 'Efeito de longe', 'Controle da cavadinha', 'Bloqueador',
  'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Marcação individual', 'Volta para marcar', 'Interceptação',
  'Arremesso lateral longo', 'Especialista em pênalti', 'Malícia', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo',
  'Liderança', 'Super substituto', 'Espírito guerreiro'
];
const IMPETO_OPTIONS = [
  'Chute', 'Cobrança de falta', 'Disputa aérea', 'Passe', 'Condução de bola', 'Técnica', 'Defesa', 'Duelo', 'Agilidade',
  'Fisicalidade', 'Goleiro', 'Instinto artilheiro', 'Guardião', 'Motor do time', 'Defesaça', 'Cruzamento', 'Fantasista',
  'Volante criativo', 'Reconstrução', 'Precisão', 'Criador ofensivo', 'Proteção de Posse', 'Transição ofensiva',
  'Bloqueio Aéreo', 'Rompe-barreira', 'Força', 'Movimento sem a bola', 'Roubo de bola'
];

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trainingEntries(plan?: Partial<Record<TrainingKey, number>>) {
  if (!plan) return [];
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => ({ key: key as TrainingKey, label: TRAINING_LABELS[key as TrainingKey], value: Number(value) }));
}

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Card({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('build');
  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState<PositionCode>('DMF');
  const [targetPosition, setTargetPosition] = useState<PositionCode | 'AUTO'>('AUTO');
  const [playstyle, setPlaystyle] = useState('O destruidor');
  const [objective, setObjective] = useState<Objective>('COMPETITIVE');
  const [formation, setFormation] = useState<TacticalFormation>('AUTO');
  const [tacticalStyle, setTacticalStyle] = useState<TacticalStyle>('AUTO');
  const [overall, setOverall] = useState('');
  const [level, setLevel] = useState('33');
  const [points, setPoints] = useState('64');
  const [attributes, setAttributes] = useState<Attributes>(() => defaultAttributesFor('DMF'));
  const [nativeSkills, setNativeSkills] = useState<string[]>([]);
  const [impetos, setImpetos] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [vault, setVault] = useState<SavedBuild[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(VAULT_KEY).then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedBuild[];
      setVault(Array.isArray(parsed) ? parsed : []);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(VAULT_KEY, JSON.stringify(vault.slice(0, 200))).catch(() => undefined);
  }, [vault]);

  const visibleAttributes = useMemo(() => {
    if (position === 'GK') {
      return ATTRIBUTE_INPUTS.filter((item) => item.key.startsWith('goalkeeper') || ['jump', 'physicalContact', 'kickingPower'].includes(item.key));
    }
    return ATTRIBUTE_INPUTS.filter((item) => !item.key.startsWith('goalkeeper'));
  }, [position]);

  function resetAttributesFor(nextPosition: PositionCode) {
    setPosition(nextPosition);
    if (nextPosition === 'GK') {
      setObjective('GOALKEEPER');
      setTargetPosition('GK');
      setPlaystyle('Goleiro defensivo');
    } else if (position === 'GK') {
      setObjective('COMPETITIVE');
      setTargetPosition('AUTO');
      setPlaystyle('O destruidor');
    }
    setAttributes(defaultAttributesFor(nextPosition));
  }

  function updateAttribute(key: AttributeKey, text: string) {
    const numeric = Number(text.replace(',', '.'));
    setAttributes((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : undefined }));
  }

  function toggleValue(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para anexar o print do jogador.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!picked.canceled && picked.assets[0]?.uri) setImageUri(picked.assets[0].uri);
  }

  function generate() {
    try {
      const manual: ManualInput = {
        playerName,
        position,
        playstyle,
        objective,
        targetPosition,
        overall,
        level,
        points,
        attributes,
        nativeSkills,
        impetos,
        tacticalProfile: { formation, style: tacticalStyle }
      };
      const raw = buildManualText(manual);
      const analysis = analyzeCard(raw, objective, targetPosition, undefined, { formation, style: tacticalStyle });
      setResult(analysis);
      setTab('result');
    } catch (error) {
      Alert.alert('Não foi possível gerar', error instanceof Error ? error.message : 'Revise os dados do jogador.');
    }
  }

  function saveCurrent() {
    if (!result) return;
    const item: SavedBuild = {
      id: nowId(),
      createdAt: new Date().toISOString(),
      playerName: result.parsed.playerName,
      position: result.parsed.mainPositionPt,
      playstyle: result.parsed.playstyle,
      result,
      completedSkills: [],
      imageUri
    };
    setVault((prev) => [item, ...prev.filter((saved) => saved.id !== item.id)].slice(0, 200));
    Alert.alert('Ficha salva', 'A ficha entrou no Cofre Elite e ficará salva até você apagar.');
  }

  function toggleCompleted(savedId: string, skill: string) {
    setVault((prev) => prev.map((item) => {
      if (item.id !== savedId) return item;
      const completedSkills = item.completedSkills.includes(skill)
        ? item.completedSkills.filter((name) => name !== skill)
        : [...item.completedSkills, skill];
      return { ...item, completedSkills };
    }));
  }

  function deleteSaved(savedId: string) {
    Alert.alert('Apagar ficha', 'Deseja apagar esta ficha do Cofre Elite?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => setVault((prev) => prev.filter((item) => item.id !== savedId)) }
    ]);
  }

  function renderBuild() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card title="Central de Precisão Manual" subtitle="Versão React Native real. Sem site aberto no navegador. Preencha os dados e gere a ficha no próprio app.">
          <Text style={styles.label}>Nome do jogador</Text>
          <TextInput value={playerName} onChangeText={setPlayerName} placeholder="Ex.: Edgar Davids" placeholderTextColor="#6d7486" style={styles.input} />

          <Text style={styles.label}>Posição da carta</Text>
          <View style={styles.chipGrid}>
            {[...LINE_POSITIONS, GK_POSITION].map((code) => (
              <Chip key={code} label={POSITION_LABELS.find((item) => item.code === code)?.label.split(' - ')[0] ?? code} selected={position === code} onPress={() => resetAttributesFor(code)} />
            ))}
          </View>

          <Text style={styles.label}>Estilo de jogo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {PLAYSTYLE_OPTIONS.map((style) => <Chip key={style} label={style} selected={playstyle === style} onPress={() => setPlaystyle(style)} />)}
          </ScrollView>

          <Text style={styles.label}>Perfil de performance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {OBJECTIVE_LABELS.map((item) => <Chip key={item.value} label={item.label} selected={objective === item.value} onPress={() => setObjective(item.value)} />)}
          </ScrollView>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>GER</Text>
              <TextInput value={overall} onChangeText={setOverall} keyboardType="number-pad" placeholder="88" placeholderTextColor="#6d7486" style={styles.input} />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Nível</Text>
              <TextInput value={level} onChangeText={setLevel} keyboardType="number-pad" placeholder="33" placeholderTextColor="#6d7486" style={styles.input} />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Pontos</Text>
              <TextInput value={points} onChangeText={setPoints} keyboardType="number-pad" placeholder="64" placeholderTextColor="#6d7486" style={styles.input} />
            </View>
          </View>
        </Card>

        <Card title="Plano tático" subtitle="A ficha considera formação e estilo do técnico para ajustar o desempenho em campo.">
          <Text style={styles.label}>Formação</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {FORMATIONS.map((item) => <Chip key={item} label={item === 'AUTO' ? 'Automático' : item} selected={formation === item} onPress={() => setFormation(item)} />)}
          </ScrollView>
          <Text style={styles.label}>Estilo do técnico</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {TACTICAL_STYLES.map((item) => <Chip key={item.value} label={item.label} selected={tacticalStyle === item.value} onPress={() => setTacticalStyle(item.value)} />)}
          </ScrollView>
        </Card>

        <Card title="Atributos principais" subtitle="Use os atributos da carta. Para goleiro, o app mostra os campos de GO.">
          <View style={styles.attributeGrid}>
            {visibleAttributes.map((item) => (
              <View key={item.key} style={styles.attributeItem}>
                <Text style={styles.attributeLabel}>{item.label}</Text>
                <TextInput
                  value={attributes[item.key] ? String(attributes[item.key]) : ''}
                  onChangeText={(text) => updateAttribute(item.key, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#6d7486"
                  style={styles.attributeInput}
                />
              </View>
            ))}
          </View>
        </Card>

        <Card title="Habilidades e ímpetos" subtitle="Marque o que o jogador já tem. O app evita recomendar coisas sem sentido para a função.">
          <Text style={styles.label}>Habilidades atuais</Text>
          <View style={styles.chipGrid}>
            {SKILL_OPTIONS.map((skill) => <Chip key={skill} label={skill} selected={nativeSkills.includes(skill)} onPress={() => toggleValue(nativeSkills, skill, setNativeSkills)} />)}
          </View>
          <Text style={styles.label}>Ímpetos atuais</Text>
          <View style={styles.chipGrid}>
            {IMPETO_OPTIONS.map((impeto) => <Chip key={impeto} label={impeto} selected={impetos.includes(impeto)} onPress={() => toggleValue(impetos, impeto, setImpetos)} />)}
          </View>
        </Card>

        <Card title="Print da carta" subtitle="Nesta primeira versão React Native, o print fica anexado ao Cofre. A leitura OCR nativa entra na próxima etapa com ML Kit.">
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
          <Pressable style={styles.secondaryButton} onPress={pickImage}><Text style={styles.secondaryButtonText}>Anexar print do jogador</Text></Pressable>
        </Card>

        <Pressable style={styles.primaryButton} onPress={generate}>
          <Text style={styles.primaryButtonText}>Gerar Plano Elite</Text>
        </Pressable>
      </ScrollView>
    );
  }

  function renderResult() {
    if (!result) {
      return <View style={styles.empty}><Text style={styles.emptyText}>Gere uma ficha primeiro.</Text></View>;
    }
    const training = trainingEntries(result.training);
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card title={result.parsed.playerName} subtitle={`${result.parsed.mainPositionPt} • ${result.parsed.playstyle ?? 'Sem estilo informado'} • ${result.buildName}`}>
          <Text style={styles.resultBig}>Função alvo: {result.bestPosition.label}</Text>
          <Text style={styles.note}>{result.note}</Text>
          <View style={styles.metricRow}>
            <View style={styles.metric}><Text style={styles.metricValue}>{result.trainingPointsUsed}</Text><Text style={styles.metricLabel}>pontos usados</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{result.trainingPointsRemaining}</Text><Text style={styles.metricLabel}>sobrando</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{Math.round(result.bestPosition.score)}</Text><Text style={styles.metricLabel}>nota função</Text></View>
          </View>
        </Card>

        <Card title="Ficha recomendada">
          {training.map((item) => (
            <View key={item.key} style={styles.trainingRow}>
              <Text style={styles.trainingLabel}>{item.label}</Text>
              <Text style={styles.trainingValue}>{item.value}</Text>
            </View>
          ))}
        </Card>

        <Card title="Habilidades recomendadas">
          {result.recommendedSkills.slice(0, 8).map((skill) => <Text key={skill} style={styles.listText}>• {skill}</Text>)}
        </Card>

        <Card title="Ímpetos recomendados">
          {result.recommendedImpetos.slice(0, 6).map((item) => <Text key={item.name} style={styles.listText}>• {item.name}: {item.reason}</Text>)}
        </Card>

        <Card title="Explicação do plano">
          {result.recommendationExplanation.slice(0, 5).map((text, index) => <Text key={index} style={styles.listText}>• {text}</Text>)}
          {result.profileTips.slice(0, 4).map((text, index) => <Text key={`tip-${index}`} style={styles.listText}>• {text}</Text>)}
        </Card>

        <Pressable style={styles.primaryButton} onPress={saveCurrent}>
          <Text style={styles.primaryButtonText}>Salvar no Cofre Elite</Text>
        </Pressable>
      </ScrollView>
    );
  }

  function renderVault() {
    if (!vault.length) return <View style={styles.empty}><Text style={styles.emptyText}>Nenhuma ficha salva ainda.</Text></View>;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        {vault.map((saved) => {
          const skills = saved.result.recommendedSkills.slice(0, 8);
          const progress = skills.length ? `${saved.completedSkills.filter((skill) => skills.includes(skill)).length}/${skills.length}` : '0/0';
          return (
            <Card key={saved.id} title={saved.playerName} subtitle={`${saved.position} • ${saved.playstyle ?? 'Sem estilo'} • Progresso ${progress}`}>
              {saved.imageUri ? <Image source={{ uri: saved.imageUri }} style={styles.previewSmall} /> : null}
              <Text style={styles.resultBig}>{saved.result.bestPosition.label}</Text>
              {skills.map((skill) => (
                <Pressable key={skill} onPress={() => toggleCompleted(saved.id, skill)} style={styles.checkRow}>
                  <View style={[styles.checkbox, saved.completedSkills.includes(skill) && styles.checkboxActive]} />
                  <Text style={styles.checkText}>{skill}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.dangerButton} onPress={() => deleteSaved(saved.id)}><Text style={styles.dangerButtonText}>Apagar ficha</Text></Pressable>
            </Card>
          );
        })}
      </ScrollView>
    );
  }

  function renderTactics() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card title="Guia tático Elite" subtitle="Resumo rápido para escolher formação e estilo do técnico.">
          <Text style={styles.listText}>• 4-2-2-2: forte para contra-ataque rápido; use VOL seguro, MLG com passe e dois atacantes complementares.</Text>
          <Text style={styles.listText}>• 4-3-3: bom para posse, por fora e pressão; pontas precisam velocidade, drible e passe final.</Text>
          <Text style={styles.listText}>• 4-1-2-3: ideal para controle central; VOL precisa interceptar e MAT precisa girar rápido.</Text>
          <Text style={styles.listText}>• 4-2-3-1: seguro para posse e contra-ataque normal; CA precisa segurar bola e MAT precisa criar.</Text>
          <Text style={styles.listText}>• 3-5-2: bom para passe longo e pressão; alas precisam resistência e cruzamento.</Text>
          <Text style={styles.listText}>• 5-3-2: defensivo; bom para segurar resultado e sair em transição.</Text>
        </Card>
        <Card title="Estilos do técnico">
          <Text style={styles.listText}>• Posse de bola: paciência, tabelas curtas e jogadores com passe/controle.</Text>
          <Text style={styles.listText}>• Contra-ataque normal: linhas mais controladas, saída rápida sem se expor tanto.</Text>
          <Text style={styles.listText}>• Contra-ataque rápido: pressão, velocidade e passe vertical.</Text>
          <Text style={styles.listText}>• Por fora: laterais/alas fortes, cruzamento e pontas abertos.</Text>
          <Text style={styles.listText}>• Passe longo: pivô, disputa aérea, segunda bola e zagueiros com passe alto.</Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>BuildMaster Elite Mobile</Text>
          <Text style={styles.appSubtitle}>React Native • APK real • Base v24 estável</Text>
        </View>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('build')} style={[styles.tab, tab === 'build' && styles.tabActive]}><Text style={styles.tabText}>Ficha</Text></Pressable>
          <Pressable onPress={() => setTab('result')} style={[styles.tab, tab === 'result' && styles.tabActive]}><Text style={styles.tabText}>Plano</Text></Pressable>
          <Pressable onPress={() => setTab('vault')} style={[styles.tab, tab === 'vault' && styles.tabActive]}><Text style={styles.tabText}>Cofre</Text></Pressable>
          <Pressable onPress={() => setTab('tactics')} style={[styles.tab, tab === 'tactics' && styles.tabActive]}><Text style={styles.tabText}>Tática</Text></Pressable>
        </View>
        {tab === 'build' ? renderBuild() : tab === 'result' ? renderResult() : tab === 'vault' ? renderVault() : renderTactics()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080A12' },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, backgroundColor: '#0E1220', borderBottomWidth: 1, borderBottomColor: '#20283B' },
  appTitle: { color: '#F4F7FF', fontSize: 22, fontWeight: '900' },
  appSubtitle: { color: '#8E9BB8', marginTop: 3, fontSize: 12 },
  tabs: { flexDirection: 'row', padding: 8, gap: 8, backgroundColor: '#0E1220' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#151B2C', alignItems: 'center' },
  tabActive: { backgroundColor: '#00E0FF' },
  tabText: { color: '#F4F7FF', fontWeight: '800', fontSize: 12 },
  content: { padding: 14, paddingBottom: 60, gap: 14 },
  card: { backgroundColor: '#111827', borderColor: '#27324A', borderWidth: 1, borderRadius: 22, padding: 16, gap: 10 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#9CA8C3', lineHeight: 19 },
  label: { color: '#DCE6FF', fontWeight: '800', marginTop: 4 },
  input: { backgroundColor: '#090D18', color: '#FFFFFF', borderColor: '#2B3650', borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15 },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horizontalScroll: { marginHorizontal: -4 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#34405B', backgroundColor: '#0A0F1D', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#00E0FF', borderColor: '#00E0FF' },
  chipText: { color: '#D4DDF4', fontWeight: '800', fontSize: 12 },
  chipTextActive: { color: '#07101B' },
  attributeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attributeItem: { width: '47%', backgroundColor: '#090D18', borderColor: '#2B3650', borderWidth: 1, borderRadius: 16, padding: 10 },
  attributeLabel: { color: '#B9C5DF', fontWeight: '800', fontSize: 12, minHeight: 32 },
  attributeInput: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', paddingVertical: 6 },
  primaryButton: { backgroundColor: '#00E0FF', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#07101B', fontWeight: '900', fontSize: 16 },
  secondaryButton: { backgroundColor: '#1C2740', borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: '#E5EDFF', fontWeight: '900' },
  dangerButton: { backgroundColor: '#30131B', borderColor: '#FF4B6B', borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  dangerButtonText: { color: '#FF9AAF', fontWeight: '900' },
  preview: { width: '100%', height: 220, borderRadius: 16, resizeMode: 'cover', backgroundColor: '#050812' },
  previewSmall: { width: '100%', height: 140, borderRadius: 16, resizeMode: 'cover', backgroundColor: '#050812' },
  resultBig: { color: '#00E0FF', fontSize: 17, fontWeight: '900' },
  note: { color: '#C7D1EA', lineHeight: 20 },
  metricRow: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, backgroundColor: '#090D18', borderRadius: 16, padding: 12, alignItems: 'center' },
  metricValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  metricLabel: { color: '#8E9BB8', fontSize: 11, textAlign: 'center' },
  trainingRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: '#27324A', borderBottomWidth: 1, paddingVertical: 10 },
  trainingLabel: { color: '#DCE6FF', fontWeight: '800' },
  trainingValue: { color: '#00E0FF', fontWeight: '900', fontSize: 16 },
  listText: { color: '#DCE6FF', lineHeight: 21, marginBottom: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#8E9BB8', textAlign: 'center', fontWeight: '800' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomColor: '#27324A', borderBottomWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#7B88A6' },
  checkboxActive: { backgroundColor: '#00E0FF', borderColor: '#00E0FF' },
  checkText: { color: '#DCE6FF', fontWeight: '800', flex: 1 }
});
