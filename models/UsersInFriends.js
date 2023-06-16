module.exports = (sequelize, DataTypes) => {
    const UsersInFriends = sequelize.define("UsersInFriends", {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    });
    return UsersInFriends;
  };
  