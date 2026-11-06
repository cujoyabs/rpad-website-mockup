<?php
/* RPAD mockup -> WordPress Playground: creates every page as an Elementor page, plus the header and footer.
   Run by blueprint.json. Safe to re-run: it deletes the default content and any earlier RPAD pages first. */
require_once '/wordpress/wp-load.php';
$site = json_decode(file_get_contents(WP_CONTENT_DIR . '/rpad-site.json'), true);
if (!$site) { echo "rpad-site.json missing or unreadable\n"; return; }
$home = untrailingslashit(home_url());
$ev = defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : '3.30.0';
$data = function ($d) use ($home) { return wp_slash(str_replace('RPADSITE', $home, wp_json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))); };
$elementor = function ($id, $d, $type) use ($data, $ev) {
    update_post_meta($id, '_elementor_edit_mode', 'builder');
    update_post_meta($id, '_elementor_template_type', $type);
    update_post_meta($id, '_elementor_version', $ev);
    update_post_meta($id, '_elementor_data', $data($d));
};

// clean slate: default post/page and earlier runs
foreach (get_posts(['post_type' => ['page', 'post', 'elementor-hf'], 'numberposts' => -1, 'post_status' => 'any']) as $p) wp_delete_post($p->ID, true);

// pages, parents first
$pages = $site['pages'];
usort($pages, function ($a, $b) { $da = $a['path'] === '' ? -1 : substr_count($a['path'], '/'); $db = $b['path'] === '' ? -1 : substr_count($b['path'], '/'); return $da <=> $db ?: $a['order'] <=> $b['order']; });
$ids = [];
foreach ($pages as $p) {
    $id = wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'],
        'post_parent' => ($p['path'] === '' || $p['parent'] === '') ? 0 : ($ids[$p['parent']] ?? 0), 'menu_order' => $p['order'], 'post_content' => '']);
    if (is_wp_error($id) || !$id) { echo 'failed: ' . $p['path'] . "\n"; continue; }
    update_post_meta($id, '_wp_page_template', 'elementor_header_footer');
    update_post_meta($id, '_elementor_page_settings', ['hide_title' => 'yes']);
    $elementor($id, $p['data'], 'wp-page');
    $ids[$p['path']] = $id;
}
update_option('show_on_front', 'page');
update_option('page_on_front', $ids[''] ?? 0);

// header and footer (Elementor Header & Footer Builder, the free plugin the City sites use)
foreach (['header' => 'type_header', 'footer' => 'type_footer'] as $k => $type) {
    if (empty($site[$k])) continue;
    $id = wp_insert_post(['post_type' => 'elementor-hf', 'post_status' => 'publish', 'post_title' => 'RPAD ' . $k]);
    update_post_meta($id, 'ehf_template_type', $type);
    update_post_meta($id, 'ehf_target_include_locations', ['rule' => ['basic-global'], 'specific' => []]);
    update_post_meta($id, 'ehf_target_exclude_locations', []);
    update_post_meta($id, 'ehf_target_user_roles', ['all']);
    update_post_meta($id, '_wp_page_template', 'elementor_canvas');
    $elementor($id, $site[$k], 'wp-post');
}

// normal page addresses (/appeals/file-an-appeal/), quiet Elementor onboarding, fresh Elementor CSS
update_option('permalink_structure', '/%postname%/');
flush_rewrite_rules(true);
update_option('elementor_onboarded', true);
delete_transient('elementor_activation_redirect');
update_option('blogname', 'RPAD website mockup (Playground test)');
update_option('blog_public', '0');
if (class_exists('\Elementor\Plugin')) { \Elementor\Plugin::$instance->files_manager->clear_cache(); }
echo 'RPAD: created ' . count($ids) . " pages\n";
