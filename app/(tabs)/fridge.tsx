import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { AddFridgeSheet } from '@/components/fridge/AddFridgeSheet';
import { SwipeableFridgeRow } from '@/components/fridge/SwipeableFridgeRow';
import { FloatingHeader, floatingHeaderClearance } from '@/components/FloatingHeader';
import { SegmentPills } from '@/components/SegmentPills';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';
import { useRecipes } from '@/context/RecipesContext';
import { useMealPlan } from '@/context/MealPlanContext';
import type { CookMatchFilter } from '@/lib/fridgeMatch';
import { missingShoppingEntries, rankRecipeMatches } from '@/lib/fridgeMatch';
import { stepForUnit } from '@/lib/fridgeQuantity';
import { isFridgeItemExpired, isFridgeItemExpiringSoon } from '@/lib/fridgeStatus';
import { PLACE_LABELS, sortFridgeItemsByExpiry } from '@/lib/fridgeStorage';
import { mergeIntoShoppingList } from '@/lib/shoppingList';
import type { FridgePlace } from '@/types/fridge';

const POPULAR = ['ไข่ไก่', 'หมูสับ', 'นมสด', 'กะเพรา', 'ข้าวสวย'];

export default function FridgeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading, catalog, addItem, subtractAmount, removeItem } = useFridge();
  const { recipes } = useRecipes();
  const { refresh: refreshPlan } = useMealPlan();
  const [tab, setTab] = useState<'items' | 'cook'>('items');
  const [addOpen, setAddOpen] = useState(false);
  const [addSeed, setAddSeed] = useState<string>();
  const [matchFilter, setMatchFilter] = useState<CookMatchFilter>('all');
  const [prioritizeExpiring, setPrioritizeExpiring] = useState(true);

  const headerClearance = floatingHeaderClearance(insets.top);

  const expiringCount = items.filter((i) => isFridgeItemExpiringSoon(i)).length;
  const expiredCount = items.filter((i) => isFridgeItemExpired(i)).length;

  const grouped = useMemo(() => {
    const places: FridgePlace[] = ['chilled', 'frozen', 'dry'];
    return places.map((place) => ({
      place,
      label: PLACE_LABELS[place],
      items: sortFridgeItemsByExpiry(items.filter((i) => i.place === place)),
    }));
  }, [items]);

  const matches = useMemo(
    () => rankRecipeMatches(recipes, items, matchFilter, prioritizeExpiring),
    [recipes, items, matchFilter, prioritizeExpiring],
  );

  const openAdd = (name?: string) => {
    setAddSeed(name);
    setAddOpen(true);
  };

  const addMissingToShopping = async (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const match = rankRecipeMatches([recipe], items, 'all', false)[0];
    const entries = missingShoppingEntries(match, recipe).map((e) => ({
      ...e,
      sourceRecipeId: recipeId,
    }));
    await mergeIntoShoppingList(entries);
    await refreshPlan();
    Alert.alert('เพิ่มแล้ว', `เพิ่มของที่ขาด ${entries.length} รายการลงรายการซื้อของ`);
  };

  return (
    <View style={styles.screen}>
      <FloatingHeader
        actions={[
          {
            icon: 'add',
            accessibilityLabel: 'เพิ่มของ',
            onPress: () => openAdd(),
          },
        ]}
      />

      {loading ? (
        <View style={[styles.centered, { paddingTop: headerClearance }]}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      ) : tab === 'items' ? (
        <ScrollView
          contentContainerStyle={{
            paddingTop: headerClearance,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: spacing.md,
          }}
        >
          <AppText variant="caption" muted>
            วันนี้ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
          </AppText>
          <AppText variant="heading" style={styles.pageTitle}>ตู้เย็นของฉัน</AppText>
          <SegmentPills
            options={[
              { id: 'items', label: `ของในตู้ ${items.length}` },
              { id: 'cook', label: `ทำอะไรได้บ้าง ${matches.length}` },
            ]}
            value={tab}
            onChange={(id) => setTab(id)}
          />
          <View style={styles.segmentSpacer} />
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="snow-outline" size={64} color={colors.inkMuted} />
              <AppText variant="title" style={styles.emptyTitle}>ตู้เย็นยังว่างอยู่</AppText>
              <Pressable style={styles.emptyBtn} onPress={() => openAdd()}>
                <Ionicons name="add" size={20} color={colors.white} />
                <AppText style={styles.emptyBtnText}>เพิ่มของชิ้นแรก</AppText>
              </Pressable>
              <View style={styles.popularRow}>
                {POPULAR.map((p) => (
                  <Pressable key={p} style={styles.popChip} onPress={() => openAdd(p)}>
                    <AppText variant="caption">{p}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              {(expiringCount > 0 || expiredCount > 0) && (
                <Pressable
                  style={styles.banner}
                  onPress={() => setTab('cook')}
                >
                  <View style={styles.bannerTextCol}>
                    <AppText variant="label" style={styles.bannerTitle}>
                      {expiringCount > 0 ? `ใกล้หมดอายุ ${expiringCount} รายการ` : 'ตรวจของในตู้'}
                    </AppText>
                    <AppText variant="caption" style={styles.bannerSub}>
                      {expiredCount > 0
                        ? `หมดอายุแล้ว ${expiredCount} รายการ · ดูว่าทำอะไรได้บ้าง`
                        : 'ดูว่าทำอะไรได้บ้าง'}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.cardYellow} />
                </Pressable>
              )}
              {grouped.map((g) =>
                g.items.length === 0 ? null : (
                  <View key={g.place} style={styles.section}>
                    <View style={styles.sectionHead}>
                      <AppText variant="label" style={styles.sectionTitle}>{g.label}</AppText>
                      <View style={styles.sectionBadge}>
                        <AppText variant="caption" style={styles.sectionBadgeText}>{g.items.length}</AppText>
                      </View>
                    </View>
                    {g.items.map((item) => (
                      <SwipeableFridgeRow
                        key={item.id}
                        item={item}
                        onPress={() => router.push(`/fridge/${item.id}`)}
                        onUse={() => subtractAmount(item.id, stepForUnit(item.unit))}
                        onEdit={() => router.push(`/fridge/${item.id}`)}
                        onDelete={() => {
                          Alert.alert('ลบรายการ?', item.name, [
                            { text: 'ยกเลิก', style: 'cancel' },
                            { text: 'ลบ', style: 'destructive', onPress: () => removeItem(item.id) },
                          ]);
                        }}
                      />
                    ))}
                  </View>
                ),
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingTop: headerClearance,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: spacing.md,
          }}
        >
          <AppText variant="caption" muted>
            วันนี้ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
          </AppText>
          <AppText variant="heading" style={styles.pageTitle}>ตู้เย็นของฉัน</AppText>
          <SegmentPills
            options={[
              { id: 'items', label: `ของในตู้ ${items.length}` },
              { id: 'cook', label: `ทำอะไรได้บ้าง ${matches.length}` },
            ]}
            value={tab}
            onChange={(id) => setTab(id)}
          />
          <View style={styles.segmentSpacer} />
          <View style={styles.filterRow}>
            {(
              [
                ['all', 'ทั้งหมด'],
                ['complete', 'ครบทุกอย่าง'],
                ['missing2', 'ขาด ≤ 2 อย่าง'],
              ] as [CookMatchFilter, string][]
            ).map(([id, label]) => (
              <Pressable
                key={id}
                style={[styles.filterChip, matchFilter === id && styles.filterChipOn]}
                onPress={() => setMatchFilter(id)}
              >
                <AppText variant="caption" style={{ color: matchFilter === id ? colors.white : colors.ink }}>
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <AppText style={{ flex: 1 }}>เรียงเมนูที่ใช้ของใกล้หมดอายุก่อน</AppText>
            <Switch
              value={prioritizeExpiring}
              onValueChange={setPrioritizeExpiring}
              trackColor={{ true: colors.orange, false: colors.border }}
            />
          </View>

          {matches.length === 0 ? (
            <AppText muted style={{ textAlign: 'center', marginTop: spacing.xl }}>
              ยังไม่มีสูตรที่ตรงกับของในตู้
            </AppText>
          ) : (
            matches.map((m) => {
              const recipe = recipes.find((r) => r.id === m.recipeId);
              if (!recipe) return null;
              return (
                <View key={m.recipeId} style={styles.matchCard}>
                  <Pressable
                    style={styles.matchTop}
                    onPress={() => router.push(`/fridge/match/${m.recipeId}`)}
                  >
                    <RecipeCoverImage recipe={recipe} style={styles.matchThumb} rounded={radius.md} />
                    <View style={styles.matchText}>
                      <AppText variant="label" numberOfLines={2}>{recipe.title}</AppText>
                      <AppText variant="caption" muted>
                        มีครบ {m.haveCount} จาก {m.totalCount} อย่าง · {m.percent}%
                      </AppText>
                      {m.missing.length > 0 && (
                        <AppText variant="caption" style={{ color: colors.danger }} numberOfLines={1}>
                          ขาด: {m.missing.slice(0, 3).join(', ')}
                        </AppText>
                      )}
                    </View>
                    <AppText style={styles.percent}>{m.percent}%</AppText>
                  </Pressable>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${m.percent}%` }]} />
                  </View>
                  <View style={styles.matchActions}>
                    {m.percent === 100 ? (
                      <Pressable
                        style={styles.cookBtn}
                        onPress={() => router.push(`/recipe/cook/${recipe.id}`)}
                      >
                        <AppText style={styles.cookBtnText}>ทำเมนูนี้เลย</AppText>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.shopBtn}
                        onPress={() => addMissingToShopping(recipe.id)}
                      >
                        <AppText style={styles.shopBtnText}>เพิ่มของที่ขาดลงรายการซื้อ</AppText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <AddFridgeSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        catalog={catalog}
        initialName={addSeed}
        onSubmit={async (data) => {
          await addItem(data);
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  pageTitle: { fontSize: 28, marginBottom: spacing.md, lineHeight: 34 },
  segmentSpacer: { height: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.warningBanner,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardYellow,
  },
  bannerTextCol: { flex: 1 },
  bannerTitle: { marginBottom: 4, color: colors.cardYellow },
  bannerSub: { color: colors.inkMuted },
  section: { marginBottom: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.semiBold },
  sectionBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: { fontSize: 11 },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.white, fontFamily: fonts.semiBold },
  popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  popChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  matchThumb: { width: 56, height: 56 },
  matchText: { flex: 1, gap: 2 },
  percent: { fontFamily: fonts.bold, color: colors.orange, fontSize: 18 },
  progressBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.orange },
  matchActions: { marginTop: spacing.md },
  cookBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cookBtnText: { color: colors.white, fontFamily: fonts.semiBold },
  shopBtn: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  shopBtnText: { color: colors.orange, fontFamily: fonts.semiBold },
});
