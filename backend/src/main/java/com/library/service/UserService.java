package com.library.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.dto.ChangePasswordDTO;
import com.library.dto.LoginDTO;
import com.library.dto.RegisterDTO;
import com.library.entity.User;
import com.library.mapper.UserMapper;
import com.library.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private JwtUtils jwtUtils;

    public Map<String, Object> register(RegisterDTO dto) {
        if (!dto.getUsername().matches("\\d{9}")) {
            throw new RuntimeException("用户名必须为9位数字");
        }
        if (dto.getPassword().length() < 6 || dto.getPassword().length() > 12) {
            throw new RuntimeException("密码长度必须为6-12位");
        }
        User exist = userMapper.selectByUsername(dto.getUsername());
        if (exist != null) {
            throw new RuntimeException("用户名已存在");
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(BCrypt.hashpw(dto.getPassword()));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setRole("USER");
        user.setStatus(1);
        userMapper.insert(user);
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        return map;
    }

    public Map<String, Object> login(LoginDTO dto) {
        User user = userMapper.selectByUsername(dto.getUsername());
        if (user == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }
        String token = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
        Map<String, Object> map = new HashMap<>();
        map.put("token", token);
        map.put("userId", user.getId());
        map.put("username", user.getUsername());
        map.put("realName", user.getRealName());
        map.put("role", user.getRole());
        return map;
    }

    public User getProfile(Long userId) {
        return userMapper.selectById(userId);
    }

    public void updateProfile(Long userId, User updateUser) {
        User user = userMapper.selectById(userId);
        if (updateUser.getRealName() != null) user.setRealName(updateUser.getRealName());
        if (updateUser.getPhone() != null) user.setPhone(updateUser.getPhone());
        if (updateUser.getEmail() != null) user.setEmail(updateUser.getEmail());
        userMapper.updateById(user);
    }

    public void changePassword(Long userId, ChangePasswordDTO dto) {
        User user = userMapper.selectById(userId);
        if (!BCrypt.checkpw(dto.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("旧密码错误");
        }
        if (dto.getNewPassword().length() < 6 || dto.getNewPassword().length() > 12) {
            throw new RuntimeException("新密码长度必须为6-12位");
        }
        user.setPassword(BCrypt.hashpw(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    public void verifyIdentity(String username, String email) {
        User user = userMapper.selectByUsername(username);
        if (user == null || !email.equals(user.getEmail())) {
            throw new RuntimeException("身份验证失败，用户名或邮箱不匹配");
        }
    }

    public void resetPassword(String username, String email, String newPassword) {
        User user = userMapper.selectByUsername(username);
        if (user == null || !email.equals(user.getEmail())) {
            throw new RuntimeException("身份验证失败，用户名或邮箱不匹配");
        }
        if (newPassword.length() < 6 || newPassword.length() > 12) {
            throw new RuntimeException("密码长度必须为6-12位");
        }
        user.setPassword(BCrypt.hashpw(newPassword));
        userMapper.updateById(user);
    }

    public Page<User> getUserPage(int page, int pageSize, String keyword) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.select(User.class, info -> !"password".equals(info.getColumn()));
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like("username", keyword)
                   .or().like("real_name", keyword)
                   .or().like("phone", keyword);
        }
        wrapper.orderByDesc("create_time");
        return userMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    public void updateUserStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        user.setStatus(status);
        userMapper.updateById(user);
    }
}
