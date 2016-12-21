class Api::V1::UsersController < Api::V1::BaseController
  skip_before_action :authenticate_from_token!, only: [:show]

  def gardens_index
    render json: serialize_models(User.find(params[:id]).gardens,
                                  include: ['garden_crops', 'pictures'])
  end

  def compatibility_score (user_id, id)
    user = User.find(user_id)
    render json: Guide.find(id).compatibility_score(user)
  end

  def show
    user = User.find(params[:id])
    if Pundit.policy(current_user, user).show?
      render json: serialize_model(user, include: ['user_setting',
                                                   'guides',
                                                   'favorited_guides'])
    else
      raise OpenfarmErrors::NotAuthorized
    end
  end

  def update
    @outcome = Users::UpdateUser.run(
      attributes: params[:data],
      current_user: current_user,
      featured_image: params[:data][:featured_image],
      user_setting: params[:data][:user_setting],
      id: "#{current_user._id}")

    respond_with_mutation(:ok, include: ['user_setting',
                                         'guides',
                                         'favorited_guides'])
  end
end
