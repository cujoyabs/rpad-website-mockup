<?php
/* RPAD mockup -> WordPress Playground: creates every page as an Elementor page, plus the header and footer.
   Run by blueprint.json. Safe to re-run: it deletes the default content and any earlier RPAD pages first.
   Errors are caught and listed at the end (and saved in the option "rpad_setup_log") instead of stopping the setup. */
if (!defined('WP_DISABLE_FATAL_ERROR_HANDLER')) define('WP_DISABLE_FATAL_ERROR_HANDLER', true);
@ini_set('display_errors', '1');
@ini_set('memory_limit', '1024M');
@set_time_limit(0);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        echo "\nRPAD SETUP STOPPED: " . $e['message'] . ' in ' . $e['file'] . ':' . $e['line'] . "\n";
    }
});
require_once '/wordpress/wp-load.php';

$log = [];
$step = function ($label, $fn) use (&$log) {
    try { return $fn(); }
    catch (\Throwable $t) { $log[] = $label . ': ' . get_class($t) . ' – ' . $t->getMessage() . ' (' . basename($t->getFile()) . ':' . $t->getLine() . ')'; return null; }
};

$site = json_decode(file_get_contents(WP_CONTENT_DIR . '/rpad-site.json'), true);
if (!$site) { echo "RPAD: rpad-site.json missing or unreadable\n"; return; }
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
$step('cleanup', function () {
    foreach (get_posts(['post_type' => ['page', 'post', 'elementor-hf'], 'numberposts' => -1, 'post_status' => 'any', 'fields' => 'ids']) as $pid) wp_delete_post($pid, true);
});

// pages, parents first
$pages = $site['pages'];
usort($pages, function ($a, $b) { $da = $a['path'] === '' ? -1 : substr_count($a['path'], '/'); $db = $b['path'] === '' ? -1 : substr_count($b['path'], '/'); return $da <=> $db ?: $a['order'] <=> $b['order']; });
$ids = [];
foreach ($pages as $p) {
    $step('page ' . ($p['path'] ?: 'home'), function () use ($p, &$ids, $elementor) {
        $id = wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'],
            'post_parent' => ($p['path'] === '' || $p['parent'] === '') ? 0 : ($ids[$p['parent']] ?? 0), 'menu_order' => $p['order'], 'post_content' => ''], true);
        if (is_wp_error($id)) throw new \Exception($id->get_error_message());
        $ids[$p['path']] = $id;
        update_post_meta($id, '_wp_page_template', 'elementor_header_footer');
        update_post_meta($id, '_elementor_page_settings', ['hide_title' => 'yes']);
        $elementor($id, $p['data'], 'wp-page');
    });
}
$step('front page', function () use ($ids) {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $ids[''] ?? 0);
});

// header and footer (Elementor Header & Footer Builder, the free plugin the City sites use)
foreach (['header' => 'type_header', 'footer' => 'type_footer'] as $k => $type) {
    $step($k, function () use ($site, $k, $type, $elementor) {
        if (empty($site[$k])) return;
        $id = wp_insert_post(['post_type' => 'elementor-hf', 'post_status' => 'publish', 'post_title' => 'RPAD ' . $k], true);
        if (is_wp_error($id)) throw new \Exception($id->get_error_message());
        update_post_meta($id, 'ehf_template_type', $type);
        update_post_meta($id, 'ehf_target_include_locations', ['rule' => ['basic-global'], 'specific' => []]);
        update_post_meta($id, 'ehf_target_exclude_locations', []);
        update_post_meta($id, 'ehf_target_user_roles', ['all']);
        update_post_meta($id, '_wp_page_template', 'elementor_canvas');
        $elementor($id, $site[$k], 'wp-post');
    });
}

// normal page addresses (/appeals/file-an-appeal/), quiet Elementor onboarding, fresh Elementor CSS
$step('settings', function () {
    update_option('permalink_structure', '/%postname%/');
    flush_rewrite_rules(false);
    update_option('elementor_onboarded', true);
    delete_transient('elementor_activation_redirect');
    update_option('blogname', 'RPAD website mockup (Playground test)');
    update_option('blog_public', '0');
});
$step('elementor cache', function () {
    if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) \Elementor\Plugin::$instance->files_manager->clear_cache();
});

update_option('rpad_setup_log', $log, false);
echo 'RPAD: created ' . count($ids) . " pages\n";
if ($log) echo "RPAD problems:\n- " . implode("\n- ", $log) . "\n";
