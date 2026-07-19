import React from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import theme, { CHART_COLORS, colors } from '@/theme';
import Card from '@/components/primitives/Card';

const screenW = Dimensions.get('window').width;
const CHART_W = screenW - 72;

const axisText = { color: theme.colors.dark[400], fontSize: 9.5 };
const shorten = (s, n = 7) => {
  const str = String(s == null ? '' : s);
  return str.length > n ? `${str.slice(0, n)}…` : str;
};

function Frame({ title, subtitle, legend, children }) {
  return (
    <Card>
      <View style={styles.frameHead}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      {legend && legend.length ? (
        <View style={styles.legend}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export function BarChartCard({ title, subtitle, data = [], xKey, bars = [], maxBars = 12, height = 200 }) {
  const rows = data.slice(0, maxBars);
  const stacked = bars.length > 1;
  const n = Math.max(rows.length, 1);
  const barWidth = Math.max(14, Math.min(34, (CHART_W - 44) / n - 10));
  const spacing = Math.max(8, (CHART_W - 44 - barWidth * n) / n);

  let chartProps;
  if (stacked) {
    const stackData = rows.map((d) => ({
      label: shorten(d[xKey]),
      stacks: bars.map((b) => ({ value: Number(d[b.key]) || 0, color: b.color })),
    }));
    chartProps = { stackData };
  } else {
    const b0 = bars[0] || { color: colors.primary[600] };
    chartProps = {
      data: rows.map((d) => ({ value: Number(d[b0.key]) || 0, label: shorten(d[xKey]), frontColor: b0.color || colors.primary[600] })),
    };
  }

  return (
    <Frame title={title} subtitle={subtitle} legend={stacked ? bars.map((b) => ({ label: b.label, color: b.color })) : null}>
      {rows.length === 0 ? (
        <EmptyChart />
      ) : (
        <BarChart
          {...chartProps}
          height={height}
          width={CHART_W}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={16}
          barBorderRadius={4}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={0}
          rulesColor={theme.colors.dark[100]}
          rulesType="solid"
          xAxisLabelTextStyle={axisText}
          yAxisTextStyle={axisText}
          isAnimated
          disableScroll
        />
      )}
    </Frame>
  );
}

export function LineChartCard({ title, subtitle, data = [], xKey, lines = [], height = 210 }) {
  const rows = data;
  const n = Math.max(rows.length, 1);
  const spacing = Math.max(28, Math.min(70, (CHART_W - 40) / n));
  const series = lines.slice(0, 4);
  const chartData = {};
  series.forEach((ln, i) => {
    const key = i === 0 ? 'data' : `data${i + 1}`;
    chartData[key] = rows.map((d) => ({ value: Number(d[ln.key]) || 0, label: shorten(d[xKey]) }));
    chartData[i === 0 ? 'color' : `color${i + 1}`] = ln.color || CHART_COLORS[i];
  });

  return (
    <Frame title={title} subtitle={subtitle} legend={series.map((l, i) => ({ label: l.label, color: l.color || CHART_COLORS[i] }))}>
      {rows.length === 0 ? (
        <EmptyChart />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            {...chartData}
            height={height}
            spacing={spacing}
            initialSpacing={16}
            thickness={2.5}
            curved
            hideDataPoints={rows.length > 14}
            dataPointsColor={series[0] && (series[0].color || CHART_COLORS[0])}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={theme.colors.dark[200]}
            rulesColor={theme.colors.dark[100]}
            xAxisLabelTextStyle={axisText}
            yAxisTextStyle={axisText}
            isAnimated
          />
        </ScrollView>
      )}
    </Frame>
  );
}

export function PieChartCard({ title, subtitle, data = [], nameKey = 'name', valueKey = 'value', donut = true }) {
  const rows = data.filter((d) => Number(d[valueKey]) > 0);
  const pieData = rows.map((d, i) => ({ value: Number(d[valueKey]) || 0, color: CHART_COLORS[i % CHART_COLORS.length], text: '' }));
  const total = pieData.reduce((t, d) => t + d.value, 0);

  return (
    <Frame title={title} subtitle={subtitle}>
      {pieData.length === 0 ? (
        <EmptyChart />
      ) : (
        <View style={styles.pieRow}>
          <PieChart
            data={pieData}
            donut={donut}
            radius={78}
            innerRadius={donut ? 48 : 0}
            innerCircleColor={theme.card}
            centerLabelComponent={donut ? () => (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.centerNum}>{pieData.length}</Text>
                <Text style={styles.centerLbl}>items</Text>
              </View>
            ) : undefined}
          />
          <View style={styles.pieLegend}>
            {rows.slice(0, 8).map((d, i) => {
              const pct = total ? ((Number(d[valueKey]) / total) * 100).toFixed(0) : 0;
              return (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{shorten(d[nameKey], 16)} · {pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Frame>
  );
}

function EmptyChart() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frameHead: { marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 11.5, color: theme.textFaint, marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11.5, color: theme.colors.dark[600] },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pieLegend: { flex: 1, gap: 2 },
  centerNum: { fontSize: 18, fontWeight: '700', color: theme.text },
  centerLbl: { fontSize: 10, color: theme.textFaint },
  empty: { height: 160, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: theme.textFaint, fontSize: 13 },
});

export default { BarChartCard, LineChartCard, PieChartCard };
