class ConfirmationsController < Devise::ConfirmationsController
  def show
    token = params[:confirmation_token].encode!(
      'UTF-8',
      'binary',
      invalid: :replace,
      undef: :replace,
      replace: ''
    )
    self.resource = resource_class.confirm_by_token(token)
    if resource.errors.empty?
      set_flash_message(:notice, :confirmed) if is_navigational_format?
      user = sign_in(resource_name, resource)
      @outcome = Gardens::CreateGarden.run(
        params,
        user: user,
        name: I18n.t('registrations.your_first_garden'),
        description: I18n.t('registrations.generated_this_garden'),
        average_sun: 'Full Sun',
        type: 'Outside',
        soil_type: 'Loam'
      )
      respond_with_navigational(resource) do
        if resource.has_filled_required_settings?
          redirect_to url_for(controller: 'users',
                              action: 'show',
                              id: resource)
        else
          redirect_to url_for(controller: 'users',
                              action: 'finish')
        end
      end
    else
      respond_with_navigational(
        resource.errors,
        status: :unprocessable_entity ){
          render '/devise/confirmations/new'
        }
    end
  end
end
