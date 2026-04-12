import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../models/customer_model.dart';
import '../../config/theme.dart';

class AddCustomerScreen extends StatefulWidget {
  const AddCustomerScreen({super.key});

  @override
  State<AddCustomerScreen> createState() => _AddCustomerScreenState();
}

class _AddCustomerScreenState extends State<AddCustomerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _searchCtrl = TextEditingController();
  bool _searchByEmail = true;
  bool _isLoading = false;
  String? _errorMessage;

  List<CustomerModel> _roster = [];
  bool _rosterLoading = false;

  @override
  void initState() {
    super.initState();
    _loadRoster();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadRoster() async {
    final token = context.read<AuthProvider>().accessToken;
    if (token == null) return;
    setState(() => _rosterLoading = true);
    try {
      final customers = await ApiService.instance.getCustomers(token);
      setState(() => _roster = customers);
    } catch (_) {
    } finally {
      setState(() => _rosterLoading = false);
    }
  }

  Future<void> _addCustomer() async {
    if (!_formKey.currentState!.validate()) return;
    final token = context.read<AuthProvider>().accessToken;
    if (token == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final customer = await ApiService.instance.addCustomer(
        token,
        email: _searchByEmail ? _searchCtrl.text.trim() : null,
        phone: _searchByEmail ? null : _searchCtrl.text.trim(),
      );
      _searchCtrl.clear();
      setState(() => _roster = [customer, ..._roster]);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${customer.displayName} added to your roster'),
            backgroundColor: kPrimary,
          ),
        );
      }
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'An unexpected error occurred');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ADD CUSTOMER')),
      body: Column(
        children: [
          // Search form
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Find an existing Mowzaic customer',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Toggle: email / phone
                  Row(
                    children: [
                      _ToggleChip(
                        label: 'Email',
                        selected: _searchByEmail,
                        onTap: () =>
                            setState(() => _searchByEmail = true),
                      ),
                      const SizedBox(width: 8),
                      _ToggleChip(
                        label: 'Phone',
                        selected: !_searchByEmail,
                        onTap: () =>
                            setState(() => _searchByEmail = false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  TextFormField(
                    controller: _searchCtrl,
                    keyboardType: _searchByEmail
                        ? TextInputType.emailAddress
                        : TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: _searchByEmail
                          ? 'Customer email'
                          : 'Customer phone (10 digits)',
                      prefixIcon: Icon(
                        _searchByEmail
                            ? Icons.email_outlined
                            : Icons.phone_outlined,
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return _searchByEmail
                            ? 'Enter an email address'
                            : 'Enter a phone number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),

                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                            color: Color(0xFFEF4444), fontSize: 13),
                      ),
                    ),

                  ElevatedButton.icon(
                    onPressed: _isLoading ? null : _addCustomer,
                    icon: _isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.person_add_outlined),
                    label: const Text('Add to Roster'),
                  ),
                ],
              ),
            ),
          ),

          const Divider(height: 1),

          // Roster list
          Expanded(
            child: _rosterLoading
                ? const Center(child: CircularProgressIndicator())
                : _roster.isEmpty
                    ? const Center(
                        child: Text(
                          'No customers on your roster yet.',
                          style: TextStyle(color: Color(0xFF6B7280)),
                        ),
                      )
                    : RefreshIndicator(
                        color: kPrimary,
                        onRefresh: _loadRoster,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _roster.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 1, indent: 70),
                          itemBuilder: (_, index) {
                            final c = _roster[index];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: kPrimaryMid,
                                child: Text(
                                  c.initials,
                                  style: const TextStyle(
                                    color: kPrimaryDeep,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              title: Text(c.displayName),
                              subtitle: Text(
                                c.email ?? c.phone ?? '',
                                style: const TextStyle(fontSize: 12),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ToggleChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? kPrimary : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : const Color(0xFF374151),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
