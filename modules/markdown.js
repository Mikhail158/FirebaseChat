/*
markup file for FirebaseChat by C00l Ha43r
https://github.com/Mikhail158
supprted functionality:
[url:<display name>](<site_address>) -> replaced with <a href="site_address">display name</a>
replacement of chars for XSS prevention
*/

function textToHtml(text) {
	text = escapeHtml(text);
	text = text.replace(/\n/g, '<br>');
	
	text = text.replace(
		/([^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
		(_, smb, name, url) => smb + '<a href="' + url + '">' + name + '</a>'
	);
	
	text = text.replace(/([^\\]|^)\*\*(.+?)\*\*/g, (_, smb, content) => smb + '<b>' + content + '</b>');
	text = text.replace(/([^\\]|^)__(.+?)__/g, (_, smb, content) => smb + '<i>' + content + '</i>');
	
	text = text.replace(/\\(.)/g, (_, character) => character);
	
	return text;
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
