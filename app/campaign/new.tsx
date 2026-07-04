import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useTabloids } from '../../hooks/useTabloids';
import { formatDate } from '../../utils/formatDate';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

type CampaignStatus = 'active' | 'scheduled' | 'finished';

const STATUS_OPTIONS: { key: CampaignStatus; label: string }[] = [
  { key: 'active', label: 'Ativa' },
  { key: 'scheduled', label: 'Programada' },
  { key: 'finished', label: 'Rascunho' },
];

export default function NewCampaignScreen() {
  const { createCampaign } = useCampaigns();
  const { tabs } = useTabloids();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('active');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const toggleTab = (id: string) => {
    setSelectedTabIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Informe o nome da campanha.'); return; }
    setSaving(true);
    try {
      await createCampaign({
        name: name.trim(),
        description: description.trim(),
        status,
        tabloidIds: selectedTabIds,
        views: 0,
        sales: 0,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao criar campanha', e.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const DateField = ({
    label, date, onShow,
  }: { label: string; date: Date | null; onShow: () => void }) => (
    <TouchableOpacity style={styles.dateField} onPress={onShow} activeOpacity={0.75}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{date ? formatDate(date) : 'Selecionar data'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Campanha</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome da campanha *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Promoção de Natal"
          placeholderTextColor={Colors.textMuted}
          maxLength={80}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descreva sua campanha..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.statusBtn, status === opt.key && styles.statusBtnActive]}
              onPress={() => setStatus(opt.key)}
            >
              <Text style={[styles.statusBtnText, status === opt.key && styles.statusBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Data de início</Text>
        <DateField label="Início" date={startDate} onShow={() => setShowStartPicker(true)} />

        <Text style={styles.label}>Data de fim (opcional)</Text>
        <DateField label="Fim" date={endDate} onShow={() => setShowEndPicker(true)} />

        <Text style={styles.label}>Tabloides vinculados</Text>
        {tabs.length === 0 ? (
          <View style={styles.emptyTabs}>
            <Text style={styles.emptyTabsText}>Nenhum tabloide criado ainda.</Text>
          </View>
        ) : (
          <View style={styles.tabsList}>
            {tabs.map((tab) => {
              const selected = selectedTabIds.includes(tab.id);
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabRow}
                  onPress={() => toggleTab(tab.id)}
                  activeOpacity={0.7}
                >
                  {selected
                    ? <CheckSquare size={20} color={Colors.primary} />
                    : <Square size={20} color={Colors.border} />}
                  <View style={styles.tabInfo}>
                    <Text style={styles.tabName} numberOfLines={1}>{tab.title}</Text>
                    <Text style={styles.tabMeta}>{tab.products.length} produtos</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Criar Campanha</Text>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {showStartPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setShowStartPicker(false)}>
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Data de início</Text>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setStartDate(d); }}
                  locale="pt-BR"
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.pickerDoneText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          />
        )
      )}

      {showEndPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setShowEndPicker(false)}>
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Data de fim</Text>
                <DateTimePicker
                  value={endDate ?? new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setEndDate(d); }}
                  locale="pt-BR"
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.pickerDoneText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={endDate ?? new Date()}
            mode="date"
            display="default"
            onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  scroll: { paddingHorizontal: Layout.spacing.lg, paddingTop: Layout.spacing.lg },
  label: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text,
    marginBottom: 8, marginTop: Layout.spacing.md,
  },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.md, height: 48,
    fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text,
  },
  multilineInput: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.card, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted },
  statusBtnTextActive: { color: '#fff' },
  dateField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.md, height: 48,
  },
  dateLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textMuted },
  dateValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  emptyTabs: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg, alignItems: 'center',
  },
  emptyTabsText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted },
  tabsList: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Layout.spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabInfo: { flex: 1 },
  tabName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  tabMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 16, alignItems: 'center', marginTop: Layout.spacing['2xl'],
    ...Layout.shadow.button,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing['2xl'], paddingBottom: 40,
  },
  pickerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text, marginBottom: Layout.spacing.md },
  pickerDone: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 12, alignItems: 'center', marginTop: Layout.spacing.md,
  },
  pickerDoneText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
