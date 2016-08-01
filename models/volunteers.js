var users = [];

exports.getAll = function() {
	return users;
}

exports.new = function(userId) {
	users.push(userId);
}