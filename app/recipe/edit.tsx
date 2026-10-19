import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CATEGORY_VALUES, fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRecipes } from '@/context/RecipesContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { IngredientRowsEditor } from '@/components/recipe/IngredientRowsEditor';
import { parseAmountInput } from '@/lib/amountParse';
import { clearRecipeDraft, loadRecipeDraft, saveRecipeDraft } from '@/lib/recipeDraft';
import { copyPhotoToStorage, createRecipeId, deleteRecipePhoto, photoUri } from '@/lib/storage';
import type { RecipeDifficulty, RecipeIngredient, RecipeStep } from '@/types/recipe';

const emptyIngredient = (): RecipeIngredient => ({ name: '', amount: undefined, unit: '' });
const emptyStep = (): RecipeStep => ({ text: '' });

export default function RecipeEditScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, keyboardAppearance } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { getRecipe, addRecipe, updateRecipe } = useRecipes();
  const { showSnackbar } = useSnackbar();
  const existing = id ? getRecipe(id) : undefined;
  const isEdit = Boolean(existing);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_VALUES[0]);
  const [minutes, setMinutes] = useState('15');
  const [servings, setServings] = useState('1');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('easy');
  const [notes, setNotes] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([emptyIngredient()]);
  const [amountTexts, setAmountTexts] = useState<string[]>(['']);
  const [steps, setSteps] = useState<RecipeStep[]>([emptyStep()]);
  const [photoPath, setPhotoPath] = useState<string | undefined>();
  const [localPhotoUri, setLocalPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) return;
    loadRecipeDraft().then((draft) => {
      if (!draft) return;
      setTitle(draft.title);
      setCategory(draft.category);
      setMinutes(draft.minutes);
      setServings(draft.servings);
      setNotes(draft.notes);
      setTagsText(draft.tagsText);
      setIngredients(draft.ingredients);
      setAmountTexts(draft.amountTexts);
      setSteps(draft.steps);
    });
  }, [existing]);

  useEffect(() => {
    if (existing) return;
    const t = setTimeout(() => {
      void saveRecipeDraft({
        title,
        category,
        minutes,
        servings,
        notes,
        tagsText,
        ingredients,
        amountTexts,
        steps,
        updatedAt: new Date().toISOString(),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [existing, title, category, minutes, servings, notes, tagsText, ingredients, amountTexts, steps]);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setCategory(existing.category ?? CATEGORY_VALUES[0]);
    const total = (existing.prepMinutes ?? 0) + (existing.cookMinutes ?? 0);
    setMinutes(String(total || 15));
    setServings(String(existing.servings ?? 1));
    setDifficulty(existing.difficulty ?? 'easy');
    setNotes(existing.notes ?? '');
    setTagsText((existing.tags ?? []).join(', '));
    const ings = existing.ingredients.length ? existing.ingredients : [emptyIngredient()];
    setIngredients(ings);
    setAmountTexts(ings.map((i) => (i.amount != null ? String(i.amount) : '')));
    setSteps(existing.steps.length ? existing.steps : [emptyStep()]);
    setPhotoPath(existing.photo?.path);
    setLocalPhotoUri(photoUri(existing.photo?.path));
  }, [existing]);

  if (id && !existing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.lg, alignItems: 'center' }]}>
        <AppText variant="title">ไม่พบสูตร</AppText>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <AppText style={{ color: colors.orange }}>กลับ</AppText>
        </Pressable>
      </View>
    );
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตการเข้าถึงคลังภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalPhotoUri(result.assets[0].uri);
  };

  const onSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('กรุณากรอกชื่อสูตร');
      return;
    }
    const ing = ingredients.filter((i) => i.name.trim());
    const st = steps.filter((s) => s.text.trim());
    if (ing.length === 0) {
      Alert.alert('กรุณาเพิ่มส่วนผสมอย่างน้อย 1 รายการ');
      return;
    }
    if (st.length === 0) {
      Alert.alert('กรุณาเพิ่มขั้นตอนอย่างน้อย 1 ขั้น');
      return;
    }

    setSaving(true);
    try {
      const recipeId = existing?.id ?? createRecipeId();
      let path = photoPath;
      if (localPhotoUri && (!path || localPhotoUri !== photoUri(path))) {
        if (path) await deleteRecipePhoto(path);
        path = await copyPhotoToStorage(localPhotoUri, recipeId, 'image/jpeg');
      }

      const parsedMinutes = parseInt(minutes, 10);
      const cookMinutes = Number.isFinite(parsedMinutes)
        ? Math.min(24 * 60, Math.max(0, parsedMinutes))
        : 0;
      const parsedServings = parseInt(servings, 10);
      const servingsNum = Number.isFinite(parsedServings)
        ? Math.min(99, Math.max(1, parsedServings))
        : 1;

      const ingParsed = ing.map((row, i) => ({
        ...row,
        amount: parseAmountInput(amountTexts[i] ?? ''),
      }));

      const payload = {
        title: trimmedTitle,
        category,
        prepMinutes: 0,
        cookMinutes,
        servings: servingsNum,
        difficulty,
        notes: notes.trim(),
        tags: tagsText
          .split(/[,，]/)
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
        ingredients: ingParsed,
        steps: st,
        photo: path ? { path, mime: 'image/jpeg' as const } : undefined,
        isFavorite: existing?.isFavorite ?? false,
        rating: existing?.rating,
      };

      if (isEdit && existing) {
        await updateRecipe(existing.id, payload);
        showSnackbar('บันทึกสูตรแล้ว');
        router.back();
      } else {
        await addRecipe(payload, recipeId);
        await clearRecipeDraft();
        showSnackbar('เพิ่มสูตรแล้ว');
        router.back();
      }
    } catch (e) {
      Alert.alert('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => {
            const dirty =
              title.trim() ||
              notes.trim() ||
              ingredients.some((i) => i.name.trim()) ||
              steps.some((s) => s.text.trim());
            if (dirty && !isEdit) {
              Alert.alert('ทิ้งแบบร่าง?', 'การเปลี่ยนแปลงจะไม่ถูกบันทึก', [
                { text: 'แก้ต่อ', style: 'cancel' },
                { text: 'ทิ้ง', style: 'destructive', onPress: () => router.back() },
              ]);
              return;
            }
            router.back();
          }}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color={colors.ink} />
        </Pressable>
        <AppText variant="title">{isEdit ? 'แก้ไขสูตร' : 'เพิ่มสูตรใหม่'}</AppText>
        <AppText variant="caption" muted>บันทึกอัตโนมัติ</AppText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.photoBox} onPress={pickImage}>
          {localPhotoUri ? (
            <Image source={{ uri: localPhotoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color={colors.orange} />
              <AppText muted>แตะเพื่อเพิ่มรูป</AppText>
            </>
          )}
        </Pressable>

        <Field label="ชื่อสูตร">
          <TextInput
          keyboardAppearance={keyboardAppearance}
            value={title}
            onChangeText={setTitle}
            placeholder="เช่น ผัดกะเพราหมูสับ"
            placeholderTextColor={colors.inkLight}
            style={styles.input}
          />
        </Field>

        <View style={styles.row3}>
          <Field label="หมวดหมู่" style={styles.col}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORY_VALUES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.miniChip, category === c && styles.miniChipOn]}
                >
                  <AppText variant="caption" style={{ color: category === c ? colors.surface : colors.ink }}>
                    {c}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </Field>
        </View>

        <View style={styles.row3}>
          <Field label="เวลา (นาที)" style={styles.col}>
            <TextInput
          keyboardAppearance={keyboardAppearance}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>
          <Field label="เสิร์ฟ" style={styles.col}>
            <TextInput
          keyboardAppearance={keyboardAppearance}
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>
        </View>

        <Field label="ความยาก">
          <View style={styles.diffRow}>
            {(['easy', 'medium', 'hard'] as RecipeDifficulty[]).map((d) => {
              const label = d === 'easy' ? 'ง่าย' : d === 'medium' ? 'ปานกลาง' : 'ยาก';
              return (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={[styles.diffBtn, difficulty === d && styles.diffBtnOn]}
                >
                  <AppText variant="label" style={{ color: difficulty === d ? colors.surface : colors.ink }}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <SectionTitle title="ส่วนผสม" />
        <IngredientRowsEditor
          ingredients={ingredients}
          amountTexts={amountTexts}
          keyboardAppearance={keyboardAppearance}
          onChange={(ings, amounts) => {
            setIngredients(ings);
            setAmountTexts(amounts);
          }}
        />

        <SectionTitle title="วิธีทำ" />
        {steps.map((step, i) => (
          <View key={i} style={styles.stepEdit}>
            <AppText variant="label" muted>{i + 1}.</AppText>
            <TextInput
          keyboardAppearance={keyboardAppearance}
              value={step.text}
              onChangeText={(v) => {
                const next = [...steps];
                next[i] = { ...next[i], text: v };
                setSteps(next);
              }}
              placeholder="อธิบายขั้นตอน"
              placeholderTextColor={colors.inkLight}
              multiline
              style={[styles.input, styles.stepInput]}
            />
            <Pressable onPress={() => setSteps(steps.filter((_, idx) => idx !== i))} disabled={steps.length <= 1}>
              <Ionicons name="trash-outline" size={22} color={colors.inkLight} />
            </Pressable>
          </View>
        ))}
        <AddLine label="+ เพิ่มขั้นตอน" onPress={() => setSteps([...steps, emptyStep()])} />

        <Field label="แท็ก (คั่นด้วยจุลภาค)">
          <TextInput
          keyboardAppearance={keyboardAppearance}
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="เผ็ด, จานด่วน"
            placeholderTextColor={colors.inkLight}
            style={styles.input}
          />
        </Field>

        <Field label="โน้ต">
          <TextInput
          keyboardAppearance={keyboardAppearance}
            value={notes}
            onChangeText={setNotes}
            placeholder="บันทึกเพิ่มเติม"
            placeholderTextColor={colors.inkLight}
            multiline
            style={[styles.input, styles.notesInput]}
          />
        </Field>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
          <AppText style={styles.saveBtnText}>{saving ? 'กำลังบันทึก...' : 'บันทึกสูตร'}</AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.field, style]}>
      <AppText variant="label" style={styles.fieldLabel}>{label}</AppText>
      {children}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const styles = useThemedStyles(createStyles);
  return <AppText variant="title" style={styles.sectionTitle}>{title}</AppText>;
}

function AddLine({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.addLine}>
      <AppText style={{ color: colors.orange, fontFamily: fonts.semiBold }}>{label}</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.md,
  },
  photoBox: {
    height: 180,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  row3: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  miniChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  miniChipOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  diffRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  diffBtnOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flex1: { flex: 1, minWidth: 0 },
  flex2: { flex: 2, minWidth: 0 },
  stepEdit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepInput: {
    flex: 1,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  addLine: {
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.surface,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
});
