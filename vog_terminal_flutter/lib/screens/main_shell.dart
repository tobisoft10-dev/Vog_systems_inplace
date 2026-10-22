import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'personnel_packing_screen.dart';
import 'packing_screen.dart';
import 'receiving_screen.dart';
import 'settings_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    PersonnelPackingScreen(),
    PackingScreen(),
    ReceivingScreen(),
    SettingsScreen(),
  ];

  void _onTabSelected(int index) {
    if (_currentIndex != index) {
      HapticFeedback.selectionClick();
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF111827),
          border: Border(
            top: BorderSide(color: Color(0xFF1F2937), width: 1.5),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  index: 0,
                  icon: Icons.badge_outlined,
                  activeIcon: Icons.badge,
                  label: 'Personel',
                  subLabel: 'Koli & Eşleşme',
                  activeColor: const Color(0xFFE5A93C),
                ),
                _buildNavItem(
                  index: 1,
                  icon: Icons.unarchive_outlined,
                  activeIcon: Icons.unarchive,
                  label: 'Sevk Çıkış',
                  subLabel: 'Toptan Koli',
                  activeColor: const Color(0xFF38BDF8),
                ),
                _buildNavItem(
                  index: 2,
                  icon: Icons.archive_outlined,
                  activeIcon: Icons.archive,
                  label: 'Mal Kabul',
                  subLabel: 'Stok Girişi',
                  activeColor: const Color(0xFF34D399),
                ),
                _buildNavItem(
                  index: 3,
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings,
                  label: 'Ayarlar',
                  subLabel: 'PDA & Ağ',
                  activeColor: const Color(0xFF94A3B8),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required String subLabel,
    required Color activeColor,
  }) {
    final bool isSelected = _currentIndex == index;

    return Expanded(
      child: InkWell(
        onTap: () => _onTabSelected(index),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? activeColor.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: isSelected
                ? Border.all(color: activeColor.withValues(alpha: 0.5), width: 1.2)
                : Border.all(color: Colors.transparent),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? activeColor : const Color(0xFF64748B),
                size: 22,
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF64748B),
                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              Text(
                subLabel,
                style: TextStyle(
                  color: isSelected ? activeColor : const Color(0xFF475569),
                  fontWeight: FontWeight.w600,
                  fontSize: 9.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
